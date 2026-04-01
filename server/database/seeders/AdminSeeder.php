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
        $admin = Admin::where('email', self::ADMIN_EMAIL)->first();

        if (!$admin) {
            $admin = new Admin();
            $admin->email = self::ADMIN_EMAIL;
        }

        $admin->name = self::ADMIN_NAME;
        $admin->password = Hash::make(self::ADMIN_PASSWORD);
        $admin->save();
    }
}
