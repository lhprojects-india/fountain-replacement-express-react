import { Check, Plus } from "lucide-react";

const DAYS_ORDER = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

const DAY_LABELS = {
  Mondays: 'Monday',
  Tuesdays: 'Tuesday',
  Wednesdays: 'Wednesday',
  Thursdays: 'Thursday',
  Fridays: 'Friday',
  Saturdays: 'Saturday',
  Sundays: 'Sunday',
};

const TIME_SLOTS = [
  { key: 'morning', label: 'MORNING (AM)', time: '8AM – 12PM' },
  { key: 'noon',    label: 'AFTERNOON (PM)', time: '12PM – 5PM' },
  { key: 'evening', label: 'EVENING (NGT)', time: '5PM – 10PM' },
];

function SlotToggle({ selected, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-shadeTeal focus:ring-offset-1 ${
        selected
          ? 'bg-brand-shadeTeal text-white'
          : 'bg-white/70 text-brand-shadeBlue/40 border border-white'
      }`}
    >
      {selected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2} />}
    </button>
  );
}

function AvailabilityGrid({ availability, onAvailabilityChange }) {
  const handleChange = (day, slot, value) => {
    const newAvailability = {
      ...availability,
      [day]: {
        ...availability[day],
        [slot]: value,
      },
    };
    onAvailabilityChange(newAvailability);
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Time slot summary cards */}
      <div className="flex flex-col gap-2 mb-6">
        {TIME_SLOTS.map((slot) => (
          <div key={slot.key} className="bg-white rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{slot.label}</p>
            <p className="text-base font-bold text-brand-shadeBlue">{slot.time}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white/50 rounded-2xl p-4 shadow-sm">
        {/* Column headers */}
        <div className="grid grid-cols-4 mb-3 items-center">
          <div className="col-span-1 text-xs font-semibold uppercase tracking-widest text-gray-400">Day</div>
          <div className="col-span-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">AM</div>
          <div className="col-span-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">PM</div>
          <div className="col-span-1 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">NGT</div>
        </div>

        {/* Day rows */}
        {DAYS_ORDER.map((day, index) => {
          const slots = availability[day] || { morning: false, noon: false, evening: false };
          return (
            <div
              key={day}
              className={`grid grid-cols-4 items-center py-2 ${
                index < DAYS_ORDER.length - 1 ? 'border-b border-white/60' : ''
              }`}
            >
              <div className="col-span-1 text-sm font-semibold text-brand-shadeBlue">
                {DAY_LABELS[day]}
              </div>

              <div className="col-span-1 flex justify-center">
                <SlotToggle
                  selected={slots.morning}
                  onClick={() => handleChange(day, 'morning', !slots.morning)}
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <SlotToggle
                  selected={slots.noon}
                  onClick={() => handleChange(day, 'noon', !slots.noon)}
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <SlotToggle
                  selected={slots.evening}
                  onClick={() => handleChange(day, 'evening', !slots.evening)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AvailabilityGrid;
