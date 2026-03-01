<?php

namespace App\Services;

use App\Models\Session;
use App\Models\Attendance;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;

class AttendanceService
{

    public function getSession()
    {

        $session = Session::where('active', true)
            ->orderBy('created_at', 'desc')
            ->first();

        $currentTime = Carbon::now();

        // calculate the end time + duration in minutes
        $endTime = Carbon::parse($session->created_at)->addMinutes($session->duration);

        // check if the current time is within the session's valid range
        if ($currentTime->between(Carbon::parse($session->created_at), $endTime)) {
            $timeRemaining = $endTime->diffInMinutes($currentTime);
            $session->timeRemaining = $timeRemaining;
        } else {
            $session->timeRemaining = 0;
        }

        return $session;
    }

    public function updateSessionStatus(int $sessionId, bool $active): Session
    {
        $session = Session::findOrFail($sessionId);
        $session->active = $active;
        $session->save();

        return $session;
    }

    public function createSession(array $data)
    {
        return Session::create([
            'name' => $data['name'],
            'duration' => $data['duration'],
        ]);
    }

    public function getAllSessions()
    {
        return Session::with('attendances')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function submitAttendance(int $roll)
    {
        $session = $this->getSession();

        $existingAttendance = Attendance::where('session_id', $session->id)
            ->where('roll', $roll)
            ->first();

        if ($existingAttendance) {
            throw new BadRequestException("Attendance already submitted for this session.");
        }

        return Attendance::create([
            'session_id' => $session['id'],
            'roll' => $roll,
        ]);
    }
}
