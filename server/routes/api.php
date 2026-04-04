<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminListingModerationController;
use App\Http\Controllers\AdminPostModerationController;
use App\Http\Controllers\AdminRentModerationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ListingReportController;
use App\Http\Controllers\PostCommentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostLikeController;
use App\Http\Controllers\PostReportController;
use App\Http\Controllers\ReliefController;
use App\Http\Controllers\RentListingController;
use App\Http\Controllers\RentListingReportController;
use App\Http\Controllers\SavedPostController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SessionController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/signin', [AuthController::class, 'signin']);
Route::post('/admin/signin', [AdminAuthController::class, 'signin']);

Route::middleware(['auth:admin_api'])->prefix('admin')->group(function () {
    Route::get('/posts', [AdminPostModerationController::class, 'index']);
    Route::post('/posts/{id}/verify', [AdminPostModerationController::class, 'verify']);
    Route::post('/posts/{id}/ignore-reports', [AdminPostModerationController::class, 'ignoreReports']);
    Route::delete('/posts/{id}', [AdminPostModerationController::class, 'destroy']);

    Route::get('/listings', [AdminListingModerationController::class, 'index']);
    Route::delete('/listings/{id}', [AdminListingModerationController::class, 'destroy']);
    Route::post('/listings/{id}/ban-user', [AdminListingModerationController::class, 'banSeller']);

    Route::get('/rent-listings', [AdminRentModerationController::class, 'index']);
    Route::delete('/rent-listings/{id}', [AdminRentModerationController::class, 'destroy']);
    Route::post('/rent-listings/{id}/ban-user', [AdminRentModerationController::class, 'banLandlord']);
});

Route::get('/listings', [ListingController::class, 'index']);
Route::get('/rent-listings', [RentListingController::class, 'index']);
Route::get('/rent-listings/{id}', [RentListingController::class, 'show']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{id}', [ServiceController::class, 'show']);
Route::get('/complaints', [ComplaintController::class, 'index']);
Route::get('/complaints/{id}', [ComplaintController::class, 'show']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::get('/reliefs', [ReliefController::class, 'index']);
Route::get('/reliefs/{id}', [ReliefController::class, 'show']);
Route::get('/offers', [\App\Http\Controllers\Api\OfferController::class, 'index']);
Route::get('/offers/{id}', [\App\Http\Controllers\Api\OfferController::class, 'show']);


/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api'])->group(function () {

    Route::post('/conversations', [ChatController::class, 'startConversation']);
    Route::get('/conversations', [ChatController::class, 'getUserConversations']);

    Route::post('/messages', [ChatController::class, 'sendMessage']);
    Route::get('/conversations/{id}/messages', [ChatController::class, 'getMessages']);
    Route::post('/messages/read', [ChatController::class, 'markAsRead']);
    Route::delete('/conversations/{id}', [ChatController::class, 'deleteConversation']);

    Route::post('/listings', [ListingController::class, 'store'])
        ->middleware('not_banned');
    Route::post('/listings/{id}/report', [ListingReportController::class, 'report']);
    Route::post('/rent-listings', [RentListingController::class, 'store'])
        ->middleware('not_banned');
    Route::post('/rent-listings/{id}/report', [RentListingReportController::class, 'report']);
    Route::delete('/rent-listings/{id}', [RentListingController::class, 'destroy']);

    Route::post('/services', [ServiceController::class, 'store'])
        ->middleware('not_banned');
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    Route::get('/account/profile', [AccountController::class, 'show']);
    Route::get('/account/posts', [PostController::class, 'myPosts']);
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

    Route::post('/posts', [PostController::class, 'createPost']);
    Route::delete('/posts/{id}', [PostController::class, 'deletePost']);
    Route::post('/posts/{id}/like', [PostLikeController::class, 'toggleLike']);
    Route::post('/posts/{id}/comment', [PostCommentController::class, 'addComment']);
    Route::post('/posts/{id}/save', [SavedPostController::class, 'toggleSave']);
    Route::post('/posts/{id}/report', [PostReportController::class, 'report']);

    // Offer Help API
    Route::post('/offers', [\App\Http\Controllers\Api\OfferController::class, 'store']);
    Route::delete('/offers/{id}', [\App\Http\Controllers\Api\OfferController::class, 'destroy']);

    Route::get('/account/complaints', [ComplaintController::class, 'myComplaints']);
    Route::post('/complaints', [ComplaintController::class, 'store']);
    Route::delete('/complaints/{id}', [ComplaintController::class, 'destroy']);
    Route::patch('/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);
    Route::post('/reliefs', [ReliefController::class, 'store']);
    Route::post('/reliefs/{id}/offer-help', [ReliefController::class, 'offerHelp']);
    Route::patch('/reliefs/{id}/status', [ReliefController::class, 'updateStatus']);
    Route::delete('/reliefs/{id}', [ReliefController::class, 'destroy']);
});