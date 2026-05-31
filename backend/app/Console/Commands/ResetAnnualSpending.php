<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ResetAnnualSpending extends Command
{
    protected $signature = 'users:reset-annual-spending';

    protected $description = 'Reset annual_spending for all users at the start of the year.';

    public function handle(): int
    {
        $year = (int) Carbon::now()->format('Y');
        $this->info("Resetting annual spending for year {$year}...");

        $count = 0;
        User::chunk(100, function ($users) use (&$count, $year) {
            foreach ($users as $user) {
                $user->annual_spending = 0.0;
                $user->annual_spending_year = $year;
                $user->save();
                $count++;
            }
        });

        $this->info("Reset annual spending for {$count} users.");

        return Command::SUCCESS;
    }
}
