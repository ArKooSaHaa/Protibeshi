<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\RentListingController;
use App\Http\Controllers\SessionController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/signin', [AuthController::class, 'signin']);

Route::get('/listings', [ListingController::class, 'index']);
Route::get('/rent-listings', [RentListingController::class, 'index']);
Route::get('/rent-listings/{id}', [RentListingController::class, 'show']);


/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api'])->group(function () {

    Route::post('/listings', [ListingController::class, 'store']);

    Route::get('/account/profile', [AccountController::class, 'show']);
    Route::put('/account/profile', [AccountController::class, 'update']);
    Route::post('/account/change-password', [AccountController::class, 'changePassword']);
    Route::delete('/account', [AccountController::class, 'deleteAccount']);

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

Route::middleware(['auth:sanctum,api'])->group(function () {
    Route::post('/rent-listings', [RentListingController::class, 'store']);
    Route::delete('/rent-listings/{id}', [RentListingController::class, 'destroy']);
});