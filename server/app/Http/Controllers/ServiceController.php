<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ServiceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'category'         => 'required|string|max:100',
            'short_description'=> 'required|string|max:500',
            'full_description' => 'required|string',
            'price'            => 'required|numeric|min:0',
            'price_type'       => 'required|string|max:50',
            'availability'     => 'nullable|string|max:100',
            'experience_years' => 'nullable|integer|min:0',
            'service_radius'   => 'nullable|integer|min:0',
            'location'         => 'required|string|max:255',
            'working_hours'    => 'nullable|string|max:255',
            'verified_provider'=> 'nullable|boolean',
            'cover_photo'      => 'nullable|image|max:5120',
        ]);

        $coverPhotoPath = null;

        if ($request->hasFile('cover_photo')) {
            try {
                $coverPhotoPath = $request->file('cover_photo')->store('services', 'public');
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => 'Failed to upload cover photo',
                ], 500);
            }
        }

        $service = Service::create([
            'user_id'           => Auth::id(),
            'title'             => $validated['title'],
            'category'          => $validated['category'],
            'short_description' => $validated['short_description'],
            'full_description'  => $validated['full_description'],
            'price'             => $validated['price'],
            'price_type'        => $validated['price_type'],
            'availability'      => $validated['availability'] ?? null,
            'experience_years'  => $validated['experience_years'] ?? null,
            'service_radius'    => $validated['service_radius'] ?? 0,
            'location'          => $validated['location'],
            'working_hours'     => $validated['working_hours'] ?? null,
            'verified_provider' => $validated['verified_provider'] ?? false,
            'cover_photo'       => $coverPhotoPath,
            'is_active'         => true,
        ]);

        return response()->json([
            'message' => 'Service created successfully',
            'service' => $this->formatService($service->load('user')),
        ], 201);
    }

    public function index()
    {
        $services = Service::with('user')
            ->where('is_active', true)
            ->latest()
            ->get()
            ->map(fn (Service $service) => $this->formatService($service))
            ->values();

        return response()->json($services, 200);
    }

    public function show($id)
    {
        try {
            $service = Service::with('user')
                ->where('is_active', true)
                ->findOrFail($id);

            return response()->json($this->formatService($service), 200);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'message' => 'Service not found',
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $service = Service::findOrFail($id);
        } catch (ModelNotFoundException $exception) {
            return response()->json([
                'message' => 'Service not found',
            ], 404);
        }

        if ((int) $service->user_id !== (int) Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to delete this service',
            ], 403);
        }

        $service->delete();

        return response()->json([
            'message' => 'Service deleted successfully',
        ], 200);
    }

    private function formatService(Service $service): array
    {
        return [
            'id'                => $service->id,
            'title'             => $service->title,
            'category'          => $service->category,
            'short_description' => $service->short_description,
            'full_description'  => $service->full_description,
            'price'             => (float) $service->price,
            'price_type'        => $service->price_type,
            'availability'      => $service->availability,
            'experience_years'  => $service->experience_years,
            'service_radius'    => $service->service_radius,
            'location'          => $service->location,
            'working_hours'     => $service->working_hours,
            'cover_photo'       => $service->cover_photo,
            'verified_provider' => (bool) $service->verified_provider,
            'created_at'        => $service->created_at,
            'user'              => $service->user ? [
                'id'                  => $service->user->id,
                'first_name'          => $service->user->first_name,
                'last_name'           => $service->user->last_name,
                'profile_picture'     => $this->resolveProfilePictureUrl($service->user->profile_picture),
                'profile_picture_url' => $this->resolveProfilePictureUrl($service->user->profile_picture),
            ] : null,
        ];
    }

    private function resolveProfilePictureUrl(?string $profilePicture): string
    {
        if (!$profilePicture) {
            return '';
        }

        if (filter_var($profilePicture, FILTER_VALIDATE_URL)) {
            return $profilePicture;
        }

        if (str_starts_with($profilePicture, '/')) {
            return url($profilePicture);
        }

        return url(Storage::url($profilePicture));
    }
}
