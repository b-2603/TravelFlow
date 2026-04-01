<?php

namespace App\Services;

use App\Models\Tour;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class TourDepartureService
{
    public function normalizeDepartures(array $departures): array
    {
        return collect($departures)
            ->filter(fn ($departure) => is_array($departure) && ! empty($departure['date']))
            ->map(function (array $departure) {
                return [
                    'date' => Carbon::parse($departure['date'])->toDateString(),
                    'available_slots' => (int) ($departure['available_slots'] ?? 0),
                    'price_override' => isset($departure['price_override']) && $departure['price_override'] !== ''
                        ? (float) $departure['price_override']
                        : null,
                    'status' => in_array(($departure['status'] ?? 'active'), ['active', 'paused'], true)
                        ? $departure['status']
                        : 'active',
                    'assigned_guide_id' => filled($departure['assigned_guide_id'] ?? null)
                        ? (string) $departure['assigned_guide_id']
                        : null,
                ];
            })
            ->sortBy('date')
            ->values()
            ->all();
    }

    public function ensureDepartureHasSlots(Tour $tour, string $departureDate, int $numPax): array
    {
        $index = $this->findDepartureIndex($tour, $departureDate);

        if ($index === null) {
            throw ValidationException::withMessages([
                'departure_date' => ['Selected departure date is not available for this tour.'],
            ]);
        }

        $departures = $tour->departures ?? [];
        $departure = $departures[$index];

        if (($departure['status'] ?? 'active') !== 'active') {
            throw ValidationException::withMessages([
                'departure_date' => ['Selected departure date is currently paused.'],
            ]);
        }

        if (($departure['available_slots'] ?? 0) < $numPax) {
            throw ValidationException::withMessages([
                'num_pax' => ['Not enough available slots for the selected departure date.'],
            ]);
        }

        return [$index, $departure];
    }

    public function decrementSlots(Tour $tour, string $departureDate, int $numPax): void
    {
        [$index, $departure] = $this->ensureDepartureHasSlots($tour, $departureDate, $numPax);
        $departures = $tour->departures ?? [];
        $departures[$index]['available_slots'] = (int) $departure['available_slots'] - $numPax;
        $tour->departures = array_values($departures);
        $tour->save();
    }

    public function incrementSlots(Tour $tour, string $departureDate, int $numPax): void
    {
        $index = $this->findDepartureIndex($tour, $departureDate);

        if ($index === null) {
            return;
        }

        $departures = $tour->departures ?? [];
        $departures[$index]['available_slots'] = (int) ($departures[$index]['available_slots'] ?? 0) + $numPax;
        $tour->departures = array_values($departures);
        $tour->save();
    }

    public function findDepartureIndex(Tour $tour, string $departureDate): ?int
    {
        foreach ($tour->departures ?? [] as $index => $departure) {
            if (($departure['date'] ?? null) === Carbon::parse($departureDate)->toDateString()) {
                return $index;
            }
        }

        return null;
    }
}
