<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeminiPostModerationService
{
    private const GROQ_MODELS = [
        'llama-3.1-8b-instant',
        'llama-3.1-70b-versatile',
        'mixtral-8x7b-32768',
    ];

    private const MODELS = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
    ];

    public function reviewPost(array $payload, UploadedFile|string|null $image = null): array
    {
        $prompt = $this->buildPrompt($payload);
        $imagePart = $this->buildImagePart($image);

        // First try a quick local heuristic for very clearly safe or clearly unsafe posts.
        $heuristic = $this->heuristicAutoApprove($payload);
        if ($heuristic === true) {
            return [
                'allow' => true,
                'reason' => 'Auto-approved by local heuristic: title and short description appear safe.',
                'provider' => 'heuristic',
                'raw' => null,
                'model' => null,
            ];
        }

        if ($heuristic === false) {
            return [
                'allow' => false,
                'reason' => 'Blocked by local heuristic: content contains banned patterns or links.',
                'provider' => 'heuristic',
                'raw' => null,
                'model' => null,
            ];
        }

        $provider = $this->resolveProvider();
        if ($provider === null) {
            return $this->fallbackDecision('No moderation API key is configured. Queued for manual review.');
        }

        $result = $provider === 'gemini'
            ? $this->reviewWithGemini($prompt, $imagePart)
            : $this->reviewWithGroq($prompt);

        // annotate which provider produced this result
        if (is_array($result)) {
            $result['provider'] = $provider;
        }

        // If the provider returned an unreadable response (raw is null), try the heuristic again
        // as a conservative fallback to avoid leaving clearly-safe posts pending.
        if (!isset($result['allow']) || ($result['raw'] ?? null) === null) {
            $fallback = $this->heuristicAutoApprove($payload);
            if ($fallback !== null) {
                return [
                    'allow' => (bool) $fallback,
                    'reason' => $fallback
                        ? 'Auto-approved by local heuristic (provider returned unreadable response).'
                        : 'Queued for manual review after provider returned unreadable response.',
                    'raw' => $result['raw'] ?? null,
                    'model' => $result['model'] ?? null,
                ];
            }
        }

        return $result;
    }

    /**
     * Conservative local heuristic to auto-approve or block obvious cases.
     * Returns true = approve, false = block, null = inconclusive.
     */
    private function heuristicAutoApprove(array $payload): ?bool
    {
        $title = mb_strtolower(trim((string) ($payload['title'] ?? '')));
        $short = mb_strtolower(trim((string) ($payload['short_description'] ?? '')));

        // Nothing to judge
        if ($title === '' && $short === '') {
            return null;
        }

        $combined = $title . ' ' . $short;

        // Reject if contains URLs
        if (preg_match('/https?:\/\/|www\./i', $combined)) {
            return false;
        }

        // Reject if contains emails or long phone-like sequences
        if (preg_match('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', $combined)) {
            return false;
        }

        if (preg_match('/\+?\d[\d \-\(\)]{6,}\d/', $combined)) {
            return false;
        }

        // Simple banned keywords (conservative list) — flag but allow if clearly reporting/neutral context.
        // Also catch common money/return scams where someone promises extra money back.
        $banned = [
            'kill',
            'murder',
            'rape',
            'bomb',
            'terror',
            'hate speech',
            'hate',
            'threat',
            'threaten',
            'threatening',
            'harass',
            'harassment',
            'drugs',
            'porn',
            'scam',
            'fraud',
            'gamble',
            'gambling',
            'double your money',
            'money back double',
            'return double',
            'easy money',
            'guaranteed profit',
            'investment opportunity',
            'send money',
            'transfer money',
            'bank details',
            'loan approval',
            'get rich',
        ];
        $foundBanned = false;
        foreach ($banned as $word) {
            if (str_contains($combined, $word)) {
                $foundBanned = true;
                break;
            }
        }

        if ($foundBanned) {
            return false;
        }

        // Catch promise-of-return scams even when they do not use a fixed phrase.
        $moneyTerms = ['money', 'cash', 'cashback', 'payment', 'pay', 'send', 'transfer', 'invest', 'investment', 'profit', 'returns', 'return'];
        $promiseTerms = ['double', '2x', '2x back', 'back to you', 'pay back', 'guarantee', 'guaranteed', 'sure return', 'quick return'];

        $hasMoneyTerm = false;
        foreach ($moneyTerms as $term) {
            if (str_contains($combined, $term)) {
                $hasMoneyTerm = true;
                break;
            }
        }

        if ($hasMoneyTerm) {
            foreach ($promiseTerms as $term) {
                if (str_contains($combined, $term)) {
                    return false;
                }
            }
        }

        // Simple profanity blacklist — immediate block
        $profanity = ['fuck', 'shit', 'bitch', 'asshole', 'bastard'];
        foreach ($profanity as $p) {
            if (str_contains($combined, $p)) {
                return false;
            }
        }

        // Require minimal lengths to be conclusive
        if (mb_strlen($title) < 3 || mb_strlen($short) < 8) {
            return null;
        }

        // If we reached here, it's likely a benign community post
        return true;
    }

    private function resolveProvider(): ?string
    {
        // Prefer Groq cloud API key when present (use VITE_GROQ_CLOUD_API_KEY by default)
        if ($this->getGroqApiKey() !== null) {
            return 'groq';
        }

        if ($this->getGeminiApiKey() !== null) {
            return 'gemini';
        }

        return null;
    }

    private function getGeminiApiKey(): ?string
    {
        $apiKey = $this->readEnvValue('GEMINI_API_KEY') ?: $this->readEnvValue('VITE_GEMINI_API_KEY');

        if (!is_string($apiKey)) {
            return null;
        }

        $apiKey = trim($apiKey);

        return $apiKey !== '' ? $apiKey : null;
    }

    private function getGroqApiKey(): ?string
    {
        $apiKey = $this->readEnvValue('GROQ_CLOUD_API_KEY') ?: $this->readEnvValue('VITE_GROQ_CLOUD_API_KEY');

        if (!is_string($apiKey)) {
            return null;
        }

        $apiKey = trim($apiKey);

        return $apiKey !== '' ? $apiKey : null;
    }

    private function readEnvValue(string $key): ?string
    {
        $value = getenv($key);

        if ($value === false || $value === null || $value === '') {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;
        }

        if (!is_string($value) || trim($value) === '') {
            static $dotenvValues = null;

            if ($dotenvValues === null) {
                $dotenvPath = base_path('.env');
                $dotenvValues = is_file($dotenvPath) ? (parse_ini_file($dotenvPath, false, INI_SCANNER_RAW) ?: []) : [];
            }

            $value = $dotenvValues[$key] ?? null;
        }

        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    private function reviewWithGemini(string $prompt, ?array $imagePart): array
    {
        $apiKey = $this->getGeminiApiKey();
        if ($apiKey === null) {
            return $this->fallbackDecision('Gemini API key is not configured. Queued for manual review.');
        }

        $lastError = null;

        foreach (self::MODELS as $model) {
            try {
                $response = Http::timeout(20)
                    ->acceptJson()
                    ->asJson()
                    ->post($this->buildGeminiEndpoint($apiKey, $model), [
                        'generationConfig' => [
                            'temperature' => 0.1,
                            'responseMimeType' => 'application/json',
                        ],
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => array_values(array_filter([
                                    ['text' => $prompt],
                                    $imagePart,
                                ])),
                            ],
                        ],
                    ]);

                if (!$response->ok()) {
                    $lastError = new \RuntimeException('Gemini request failed with status ' . $response->status());
                    continue;
                }

                $text = $this->extractGeminiText($response->json());
                $decision = $this->decodeDecision($text);

                if ($decision !== null) {
                    $decision['model'] = $model;
                    return $decision;
                }

                $lastError = new \RuntimeException('Gemini returned an unreadable moderation response.');
            } catch (\Throwable $exception) {
                $lastError = $exception;
                Log::warning('Gemini post moderation attempt failed', [
                    'model' => $model,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return $this->fallbackDecision(
            $lastError instanceof \Throwable ? $lastError->getMessage() : 'Gemini moderation is temporarily unavailable.'
        );
    }

    private function reviewWithGroq(string $prompt): array
    {
        $apiKey = $this->getGroqApiKey();
        if ($apiKey === null) {
            return $this->fallbackDecision('Groq API key is not configured. Queued for manual review.');
        }

        $lastError = null;

        foreach (self::GROQ_MODELS as $model) {
            try {
                $response = Http::withToken($apiKey)
                    ->timeout(20)
                    ->acceptJson()
                    ->asJson()
                    ->post('https://api.groq.com/openai/v1/chat/completions', [
                        'model' => $model,
                        'temperature' => 0.1,
                        'max_tokens' => 300,
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'You are moderating neighborhood community posts. Return JSON only with this shape: {"allow":true|false,"reason":"short professional reason"}. Allow normal neighborhood/community updates, events, help requests, safety notices, or harmless announcements. Reject spam, scam, fraud, hate speech, harassment, threats, violence, sexual content, illegal activity, personal data exposure, unrelated promotion, or otherwise inappropriate content.',
                            ],
                            [
                                'role' => 'user',
                                'content' => $prompt,
                            ],
                        ],
                    ]);

                if (!$response->ok()) {
                    $lastError = new \RuntimeException('Groq request failed with status ' . $response->status());
                    continue;
                }

                $text = (string) data_get($response->json(), 'choices.0.message.content', '');
                $decision = $this->decodeDecision($text);

                if ($decision !== null) {
                    $decision['model'] = $model;
                    return $decision;
                }

                $lastError = new \RuntimeException('Groq returned an unreadable moderation response.');
            } catch (\Throwable $exception) {
                $lastError = $exception;
                Log::warning('Groq post moderation attempt failed', [
                    'model' => $model,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return $this->fallbackDecision(
            $lastError instanceof \Throwable ? $lastError->getMessage() : 'Groq moderation is temporarily unavailable.'
        );
    }

    private function buildGeminiEndpoint(string $apiKey, string $model): string
    {
        return 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($model)
            . ':generateContent?key='
            . rawurlencode($apiKey);
    }

    private function buildPrompt(array $payload): string
    {
        $title = trim((string) ($payload['title'] ?? ''));
        $shortDescription = trim((string) ($payload['short_description'] ?? ''));
        $content = trim((string) ($payload['content'] ?? ''));
        $label = trim((string) ($payload['label'] ?? ''));
        $postType = trim((string) ($payload['post_type'] ?? ''));
        $location = trim((string) ($payload['location'] ?? ''));
        $visibility = trim((string) ($payload['visibility'] ?? ''));

        return <<<PROMPT
You are moderating a neighborhood community post for Protibeshi.
Review the submission and decide whether it can be published immediately.

Return JSON only with this shape:
{"allow":true|false,"reason":"short professional reason"}

Allow posts that are normal neighborhood/community updates, events, help requests, safety notices, or harmless announcements.
Reject posts that are spam, scam, fraud, hate speech, harassment, threats, violence, sexual content, illegal activity, personal data exposure, unrelated promotion, or otherwise inappropriate for a community feed.

Submission details:
Title: {$title}
Short description: {$shortDescription}
Content: {$content}
Label: {$label}
Post type: {$postType}
Location: {$location}
Visibility: {$visibility}
PROMPT;
    }

    private function buildImagePart(UploadedFile|string|null $image): ?array
    {
        if ($image === null) {
            return null;
        }

        $imagePath = $image instanceof UploadedFile
            ? $image->getRealPath()
            : (str_starts_with($image, '/') ? $image : storage_path('app/public/' . ltrim($image, '/')));

        if (!is_string($imagePath) || $imagePath === '' || !is_file($imagePath)) {
            return null;
        }

        $mimeType = $image instanceof UploadedFile
            ? ($image->getMimeType() ?: 'image/jpeg')
            : (mime_content_type($imagePath) ?: 'image/jpeg');

        return [
            'inline_data' => [
                'mime_type' => $mimeType,
                'data' => base64_encode((string) file_get_contents($imagePath)),
            ],
        ];
    }

    private function extractGeminiText(array $response): string
    {
        $parts = $response['candidates'][0]['content']['parts'] ?? [];
        $texts = [];

        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $texts[] = $part['text'];
            }
        }

        return trim(implode("\n", $texts));
    }

    private function decodeDecision(string $text): ?array
    {
        if ($text === '') {
            return null;
        }

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            $json = $this->extractJsonObject($text);
            $decoded = $json !== null ? json_decode($json, true) : null;
        }
        if (!is_array($decoded) || !array_key_exists('allow', $decoded)) {
            return null;
        }

        $allow = filter_var($decoded['allow'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        if ($allow === null) {
            return null;
        }

        $reason = trim((string) ($decoded['reason'] ?? ''));
        if ($reason === '') {
            $reason = $allow
                ? 'Approved by Gemini moderation.'
                : 'Rejected by Gemini moderation.';
        }

        return [
            'allow' => $allow,
            'reason' => $reason,
            'raw' => $text,
        ];
    }

    private function extractJsonObject(string $text): ?string
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        return substr($text, $start, $end - $start + 1);
    }

    private function fallbackDecision(string $reason): array
    {
        return [
            'allow' => false,
            'reason' => Str::limit($reason, 240, ''),
            'raw' => null,
            'model' => null,
        ];
    }
}
