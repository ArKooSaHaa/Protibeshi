<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminInboxController;
use App\Http\Controllers\AdminListingModerationController;
use App\Http\Controllers\AdminComplaintModerationController;
use App\Http\Controllers\AdminPostModerationController;
use App\Http\Controllers\AdminReliefModerationController;
use App\Http\Controllers\AdminRentModerationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminRestaurantModerationController;
use App\Http\Controllers\AdminServiceModerationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ListingReportController;
use App\Http\Controllers\PostCommentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostLikeController;
use App\Http\Controllers\PostVoteController;
use App\Http\Controllers\PostReportController;
use App\Http\Controllers\ReliefController;
use App\Http\Controllers\RentListingController;
use App\Http\Controllers\RentListingReportController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\RestaurantFavoriteController;
use App\Http\Controllers\RestaurantReviewController;
use App\Http\Controllers\SavedPostController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceReportController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/signin', [AuthController::class, 'signin']);
Route::post('/admin/signin', [AdminAuthController::class, 'signin']);

Route::middleware(['auth:admin_api'])->prefix('admin')->group(function () {
    Route::get('/complaints', [AdminComplaintModerationController::class, 'index']);
    Route::patch('/complaints/status/bulk', [AdminComplaintModerationController::class, 'bulkUpdateStatus']);
    Route::get('/complaints/{id}', [AdminComplaintModerationController::class, 'show']);
    Route::patch('/complaints/{id}/status', [AdminComplaintModerationController::class, 'updateStatus']);

    Route::get('/posts', [AdminPostModerationController::class, 'index']);
    Route::post('/posts/{id}/verify', [AdminPostModerationController::class, 'verify']);
    Route::post('/posts/{id}/gemini-review', [AdminPostModerationController::class, 'geminiReview']);
    Route::post('/posts/{id}/ai-reject', [AdminPostModerationController::class, 'aiReject']);
    Route::post('/posts/{id}/ignore-reports', [AdminPostModerationController::class, 'ignoreReports']);
    Route::delete('/posts/{id}', [AdminPostModerationController::class, 'destroy']);

    Route::get('/listings', [AdminListingModerationController::class, 'index']);
    Route::delete('/listings/{id}', [AdminListingModerationController::class, 'destroy']);
    Route::post('/listings/{id}/ban-user', [AdminListingModerationController::class, 'banSeller']);

    Route::get('/rent-listings', [AdminRentModerationController::class, 'index']);
    Route::delete('/rent-listings/{id}', [AdminRentModerationController::class, 'destroy']);
    Route::post('/rent-listings/{id}/ban-user', [AdminRentModerationController::class, 'banLandlord']);

    Route::get('/services', [AdminServiceModerationController::class, 'index']);
    Route::delete('/services/{id}', [AdminServiceModerationController::class, 'destroy']);
    Route::post('/services/{id}/verify', [AdminServiceModerationController::class, 'verify']);
    Route::post('/services/{id}/flag', [AdminServiceModerationController::class, 'flag']);
    Route::post('/services/{id}/ignore-reports', [AdminServiceModerationController::class, 'ignoreReports']);
    Route::post('/services/{id}/ban-user', [AdminServiceModerationController::class, 'banProvider']);

    Route::get('/restaurants', [AdminRestaurantModerationController::class, 'index']);
    Route::patch('/restaurants/{restaurant}/status', [AdminRestaurantModerationController::class, 'updateStatus']);
    Route::delete('/restaurants/{restaurant}', [AdminRestaurantModerationController::class, 'destroy']);

    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users/{user}/ban', [AdminUserController::class, 'ban']);
    Route::post('/users/{user}/unban', [AdminUserController::class, 'unban']);

    Route::get('/messages/conversations', [AdminInboxController::class, 'getConversations']);
    Route::post('/messages/conversations', [AdminInboxController::class, 'startConversation']);
    Route::get('/messages/conversations/{id}/messages', [AdminInboxController::class, 'getMessages']);
    Route::post('/messages', [AdminInboxController::class, 'sendMessage']);
    Route::post('/messages/read', [AdminInboxController::class, 'markAsRead']);
    Route::get('/messages/users', [AdminInboxController::class, 'searchUsers']);

    Route::get('/reliefs', [AdminReliefModerationController::class, 'index']);
    Route::post('/reliefs/{id}/ignore-reports', [AdminReliefModerationController::class, 'ignoreReports']);
    Route::delete('/reliefs/{id}', [AdminReliefModerationController::class, 'destroy']);
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
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);
Route::get('/restaurants/{restaurant}/reviews', [RestaurantReviewController::class, 'index']);


/*
|--------------------------------------------------------------------------
| Protected Routes (JWT Required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:api'])->group(function () {

    Route::post('/conversations', [ChatController::class, 'startConversation']);
    Route::get('/conversations', [ChatController::class, 'getUserConversations']);
    Route::post('/calls', [ChatController::class, 'startAudioCall']);
    Route::get('/calls/active', [ChatController::class, 'getActiveIncomingCall']);
    Route::get('/conversations/{id}/calls', [ChatController::class, 'getConversationCalls']);
    Route::get('/calls/{id}', [ChatController::class, 'getCallSession']);
    Route::post('/calls/{id}/end', [ChatController::class, 'endCallSession']);
    Route::post('/calls/{id}/accept', [ChatController::class, 'acceptCallSession']);
    Route::post('/calls/{id}/signal', [ChatController::class, 'sendCallSignal']);

    Route::post('/messages', [ChatController::class, 'sendMessage']);
    Route::post('/messages/gemini/reply', [ChatController::class, 'saveGeminiReply']);
    Route::get('/conversations/{id}/messages', [ChatController::class, 'getMessages']);
    Route::post('/messages/read', [ChatController::class, 'markAsRead']);
    Route::delete('/conversations/{id}', [ChatController::class, 'deleteConversation']);

    Route::post('/listings', [ListingController::class, 'store'])
        ->middleware('not_banned');
    Route::delete('/listings/{id}', [ListingController::class, 'destroy']);
    Route::post('/listings/{id}/report', [ListingReportController::class, 'report']);
    Route::post('/rent-listings', [RentListingController::class, 'store'])
        ->middleware('not_banned');
    Route::post('/rent-listings/{id}/report', [RentListingReportController::class, 'report']);
    Route::delete('/rent-listings/{id}', [RentListingController::class, 'destroy']);

    Route::post('/services', [ServiceController::class, 'store'])
        ->middleware('not_banned');
    Route::post('/services/{id}/report', [ServiceReportController::class, 'report']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    Route::get('/account/profile', [AccountController::class, 'show']);
    Route::get('/account/posts', [PostController::class, 'myPosts']);
    Route::put('/account/profile', [AccountController::class, 'update']);
    Route::post('/account/change-password', [AccountController::class, 'changePassword']);
    Route::delete('/account', [AccountController::class, 'deleteAccount']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/posts', [PostController::class, 'createPost'])
        ->middleware('not_banned');
    Route::delete('/posts/{id}', [PostController::class, 'deletePost']);
    Route::post('/posts/{id}/like', [PostLikeController::class, 'toggleLike']);
    Route::post('/posts/{id}/vote', [\App\Http\Controllers\PostVoteController::class, 'vote']);
    Route::post('/posts/{id}/comment', [PostCommentController::class, 'addComment'])
        ->middleware('not_banned');
    Route::post('/posts/{id}/save', [SavedPostController::class, 'toggleSave']);
    Route::post('/posts/{id}/report', [PostReportController::class, 'report']);

    // Offer Help API
    Route::post('/offers', [\App\Http\Controllers\Api\OfferController::class, 'store'])
        ->middleware('not_banned');
    Route::delete('/offers/{id}', [\App\Http\Controllers\Api\OfferController::class, 'destroy']);

    Route::get('/account/complaints', [ComplaintController::class, 'myComplaints']);
    Route::post('/complaints', [ComplaintController::class, 'store'])
        ->middleware('not_banned');
    Route::delete('/complaints/{id}', [ComplaintController::class, 'destroy']);
    Route::patch('/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);
    Route::post('/reliefs', [ReliefController::class, 'store'])
        ->middleware('not_banned');
    Route::post('/reliefs/{id}/offer-help', [ReliefController::class, 'offerHelp'])
        ->middleware('not_banned');
    Route::post('/reliefs/{id}/comments', [ReliefController::class, 'addComment'])
        ->middleware('not_banned');
    Route::post('/reliefs/{id}/report', [ReliefController::class, 'report']);
    Route::patch('/reliefs/{id}/status', [ReliefController::class, 'updateStatus']);
    Route::delete('/reliefs/{id}', [ReliefController::class, 'destroy']);
});

Route::middleware(['auth.api_or_sanctum'])->group(function () {
    Route::get('/account/restaurants', [RestaurantController::class, 'myRestaurants']);
    Route::post('/restaurants', [RestaurantController::class, 'store'])->middleware('not_banned');
    Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
    Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

    Route::post('/restaurants/{restaurant}/favorite', [RestaurantFavoriteController::class, 'store']);
    Route::delete('/restaurants/{restaurant}/favorite', [RestaurantFavoriteController::class, 'destroy']);
    Route::get('/restaurants/favorites', [RestaurantFavoriteController::class, 'index']);

    Route::post('/restaurants/{restaurant}/reviews', [RestaurantReviewController::class, 'store'])
        ->middleware('not_banned');
    Route::put('/restaurants/reviews/{review}', [RestaurantReviewController::class, 'update']);
    Route::delete('/restaurants/reviews/{review}', [RestaurantReviewController::class, 'destroy']);
});
