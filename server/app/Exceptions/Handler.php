<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use PDOException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Throwable $exception
     * @return \Illuminate\Http\JsonResponse|\Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $exception)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            if ($exception instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'The given data was invalid.',
                    'errors' => $exception->errors(),
                ], 422);
            }

            if ($exception instanceof AuthenticationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            if ($exception instanceof ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                ], 404);
            }

            if ($exception instanceof HttpExceptionInterface) {
                return response()->json([
                    'success' => false,
                    'message' => $exception->getMessage() ?: 'Request failed.',
                ], $exception->getStatusCode());
            }

            if ($exception instanceof QueryException || $exception instanceof PDOException) {
                Log::error('Database exception during API request', [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'exception' => get_class($exception),
                    'message' => $exception->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => config('app.debug')
                        ? ($exception->getMessage() ?: 'Database request failed.')
                        : 'Database request failed. Check server logs.',
                ], 500);
            }

            return response()->json([
                'success' => false,
                'message' => config('app.debug')
                    ? ($exception->getMessage() ?: 'An unexpected error occurred.')
                    : 'Server error.',
            ], 500);
        }

        return parent::render($request, $exception);
    }
}
