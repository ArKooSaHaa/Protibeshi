<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SessionController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/signin', [AuthController::class, 'signin']);


/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api'])->group(function () {

    Route::get('/account/profile', [AccountController::class, 'show']);
    Route::put('/account/profile', [AccountController::class, 'update']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/session', [SessionController::class, 'getSession']);

    Route::post('/session', [SessionController::class, 'createSession'])
        ->middleware('check.admin');

    Route::put('/session', [SessionController::class, 'updateSession'])
        ->middleware('check.admin');

    Route::post('/sessions', [SessionController::class, 'viewSessions'])
        ->middleware('check.admin');

    Route::post('/attendance', [SessionController::class, 'submitAttendance']);

});