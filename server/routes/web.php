<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return ['Laravel' => app()->version()];
// });

require __DIR__ . '/auth.php';

Route::get('/storage/{path}', function (string $path) {
    $cleanPath = trim(str_replace('\\', '/', $path));
    $cleanPath = ltrim($cleanPath, '/');

    if ($cleanPath === '' || str_contains($cleanPath, '..')) {
        abort(404);
    }

    $publicCandidates = array_values(array_unique(array_filter([
        $cleanPath,
        preg_replace('#^storage/#', '', $cleanPath),
        preg_replace('#^public/#', '', $cleanPath),
        preg_replace('#^public/storage/#', '', $cleanPath),
    ])));

    foreach ($publicCandidates as $candidatePath) {
        if (Storage::disk('public')->exists($candidatePath)) {
            return response()->file(storage_path('app/public/' . $candidatePath));
        }
    }

    $localCandidates = array_values(array_unique(array_filter([
        $cleanPath,
        'public/' . $cleanPath,
        'public/' . preg_replace('#^storage/#', '', $cleanPath),
        'public/' . preg_replace('#^public/storage/#', '', $cleanPath),
    ])));

    foreach ($localCandidates as $candidatePath) {
        if (Storage::disk('local')->exists($candidatePath)) {
            return response()->file(storage_path('app/' . $candidatePath));
        }
    }

    abort(404);
})->where('path', '.*');

Route::get('{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api(?:/|$)|storage(?:/|$)).*');
