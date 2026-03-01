<?php

namespace App\Http\Controllers;

use App\Services\AttendanceService;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    protected $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    // Get session data
    public function getSession(Request $request)
    {
        // Call the service to get the valid session
        $session = $this->attendanceService->getSession();
        if ($session) {
            return response()->json(['success' => true] + $session->toArray());
        } else {
            return response()->json([
                'success' => false,
                'message' => 'No active session found',
            ], 200);
        }
    }

    public function createSession(Request $request)
    {
        $sessionData = $request->validate([
            'name' => 'required|string',
            'duration' => 'required|integer',
        ]);

        $session = $this->attendanceService->createSession($sessionData);

        return response()->json([
            'success' => true,
            'session' => $session,
            'message' => 'Session created successfully',
        ]);
    }

    public function updateSession(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|integer',
            'active' => 'required|boolean',
        ]);

        $session = $this->attendanceService->updateSessionStatus($validated['session_id'], $validated['active']);

        return response()->json([
            'success' => true,
            'message' => 'Session updated successfully.',
            'session' => $session,
        ]);

    }

    public function viewSessions(Request $request)
    {
        $sessions = $this->attendanceService->getAllSessions();

        return response()->json([
            'success' => true,
            'sessions' => $sessions,
        ]);
    }

    public function submitAttendance(Request $request)
    {
        // Validate the incoming request
        $data = $request->validate([
            'roll' => 'required|int',
        ]);

        // Call the AttendanceService to submit the attendance
        $attendance = $this->attendanceService->submitAttendance($data['roll']);

        return response()->json([
            'success' => true,
            'attendance' => $attendance,
            'message' => 'Attendance submitted successfully',
        ]);
    }
}
