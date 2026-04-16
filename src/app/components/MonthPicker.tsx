import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  align?: 'left' | 'right';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthPicker({ value, onChange, align = 'right' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Parse value "YYYY-MM" -> year and month values
  const currentYear = parseInt(value.split('-')[0], 10);
  const currentMonth = parseInt(value.split('-')[1], 10);
  
  const [viewYear, setViewYear] = useState(currentYear);

  // Sync viewYear when the popover opens so it always defaults to the currently selected year
  useEffect(() => {
    if (isOpen) setViewYear(currentYear);
  }, [isOpen, currentYear]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const d = new Date();
    const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
    onChange(`${d.getFullYear()}-${formattedMonth}`);
    setIsOpen(false);
  };

  const displayFormat = new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-xs font-semibold bg-[#F4F6FA] border border-[#EEF0F6] rounded-lg px-3 py-1.5 outline-none transition-all ${
          isOpen ? "border-[#4361EE] shadow-sm shadow-blue-500/10 text-[#1B2559]" : "hover:border-[#4361EE] text-[#8F9BB3] hover:text-[#1B2559]"
        }`}
      >
        <Calendar size={13} className={isOpen ? "text-[#4361EE]" : "text-[#8F9BB3] transition-colors"} />
        <span>{displayFormat}</span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-64 bg-white border border-[#EEF0F6] shadow-[0_10px_30px_-10px_rgba(30,30,40,0.1)] rounded-xl p-3 z-50 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button 
              onClick={() => setViewYear(y => y - 1)}
              className="p-1 rounded-md hover:bg-[#F4F6FA] text-[#8F9BB3] hover:text-[#1B2559] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-[#1B2559]">{viewYear}</span>
            <button 
              onClick={() => setViewYear(y => y + 1)}
              className="p-1 rounded-md hover:bg-[#F4F6FA] text-[#8F9BB3] hover:text-[#1B2559] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {MONTHS.map((month, index) => {
              const isSelected = viewYear === currentYear && (index + 1) === currentMonth;
              return (
                <button
                  key={month}
                  onClick={() => handleSelectMonth(index)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected 
                      ? 'bg-[#1B2559] text-white shadow-md' 
                      : 'text-[#8F9BB3] hover:bg-[#EEF2FF] hover:text-[#4361EE]'
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-[#EEF0F6] flex justify-between">
            <button
              onClick={handleCurrentMonth}
              className="text-[10px] font-semibold text-[#8F9BB3] hover:text-[#4361EE] px-2 py-1 rounded-md hover:bg-[#F4F6FA] transition-colors"
            >
              This month
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-[#8F9BB3] hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
