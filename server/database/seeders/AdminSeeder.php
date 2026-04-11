<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    private const ADMIN_NAME = 'Protibeshi Admin';
    private const ADMIN_EMAIL = 'admin@gmail.com';
    private const ADMIN_PASSWORD = 'Admin@123';

    public function run(): void
    {
        $adminName = trim((string) env('ADMIN_NAME', self::ADMIN_NAME));
        $adminEmail = strtolower(trim((string) env('ADMIN_EMAIL', self::ADMIN_EMAIL)));
        $adminPassword = (string) env('ADMIN_PASSWORD', self::ADMIN_PASSWORD);

        if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL) || $adminPassword === '') {
            return;
        }

        $admin = Admin::whereRaw('LOWER(email) = ?', [$adminEmail])->first();

        if (!$admin) {
            $admin = new Admin();
        }

        $admin->email = $adminEmail;
        $admin->name = $adminName !== '' ? $adminName : self::ADMIN_NAME;
        $admin->password = Hash::make($adminPassword);
        $admin->save();
    }
}
