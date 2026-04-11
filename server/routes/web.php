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
    $cleanPath = trim($path);

    if ($cleanPath === '' || str_contains($cleanPath, '..')) {
        abort(404);
    }

    if (!Storage::disk('public')->exists($cleanPath)) {
        abort(404);
    }

    return response()->file(storage_path('app/public/' . $cleanPath));
})->where('path', '.*');

Route::get('{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api(?:/|$)|storage(?:/|$)).*');
