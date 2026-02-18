import { useMemo } from 'react';

const FLAG_CDN = 'https://flagcdn.com';
const flagUrl = (code: string) => `${FLAG_CDN}/w40/${code.toLowerCase()}.png`;

export const COUNTRIES = [
  { code: 'SA', dial: '+966', name: 'Arabie saoudite' },
  { code: 'DZ', dial: '+213', name: 'Algérie' },
  { code: 'MA', dial: '+212', name: 'Maroc' },
  { code: 'TN', dial: '+216', name: 'Tunisie' },
  { code: 'EG', dial: '+20', name: 'Égypte' },
  { code: 'AE', dial: '+971', name: 'Émirats' },
  { code: 'KW', dial: '+965', name: 'Koweït' },
  { code: 'QA', dial: '+974', name: 'Qatar' },
  { code: 'BH', dial: '+973', name: 'Bahreïn' },
  { code: 'OM', dial: '+968', name: 'Oman' },
  { code: 'JO', dial: '+962', name: 'Jordanie' },
  { code: 'LB', dial: '+961', name: 'Liban' },
  { code: 'SY', dial: '+963', name: 'Syrie' },
  { code: 'IQ', dial: '+964', name: 'Irak' },
  { code: 'YE', dial: '+967', name: 'Yémen' },
  { code: 'LY', dial: '+218', name: 'Libye' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'BE', dial: '+32', name: 'Belgique' },
  { code: 'CH', dial: '+41', name: 'Suisse' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'US', dial: '+1', name: 'États-Unis' },
  { code: 'GB', dial: '+44', name: 'Royaume-Uni' },
  { code: 'DE', dial: '+49', name: 'Allemagne' },
  { code: 'ES', dial: '+34', name: 'Espagne' },
  { code: 'IT', dial: '+39', name: 'Italie' },
  { code: 'TR', dial: '+90', name: 'Turquie' },
  { code: 'IN', dial: '+91', name: 'Inde' },
  { code: 'PK', dial: '+92', name: 'Pakistan' },
  { code: 'CN', dial: '+86', name: 'Chine' },
  { code: 'JP', dial: '+81', name: 'Japon' },
  { code: 'RU', dial: '+7', name: 'Russie' },
  { code: 'BR', dial: '+55', name: 'Brésil' },
  { code: 'AU', dial: '+61', name: 'Australie' },
  { code: 'NL', dial: '+31', name: 'Pays-Bas' },
  { code: 'SE', dial: '+46', name: 'Suède' },
  { code: 'PL', dial: '+48', name: 'Pologne' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'GR', dial: '+30', name: 'Grèce' },
] as const;

// تنسيق: نختار أطول رمز يطابق البداية (مثلاً +966 قبل +96)
const SORTED_BY_DIAL = [...COUNTRIES].filter(c => c.dial).sort((a, b) => b.dial.length - a.dial.length);

function parsePhone(value: string): { dial: string; local: string } {
  const v = (value || '').trim();
  if (!v) return { dial: COUNTRIES[0].dial, local: '' };
  if (v.startsWith('+')) {
    for (const c of SORTED_BY_DIAL) {
      if (v === c.dial || v.startsWith(c.dial + ' ') || v.startsWith(c.dial)) {
        const local = v.slice(c.dial.length).replace(/^\s+/, '').trim();
        return { dial: c.dial, local };
      }
    }
  }
  return { dial: COUNTRIES[0].dial, local: v.replace(/^\+\d+\s*/, '').trim() };
}

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  name,
  id,
  label,
  required,
  placeholder = '50 123 4567',
  className = '',
  inputClassName = '',
  disabled = false,
}: PhoneInputProps) {
  const { dial, local } = useMemo(() => parsePhone(value), [value]);
  const currentCountry = useMemo(() => COUNTRIES.find(c => c.dial === dial) || COUNTRIES[0], [dial]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDial = e.target.value;
    const full = newDial ? `${newDial} ${local}`.trim() : local;
    onChange(full);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localVal = e.target.value.replace(/[^\d\s\-()]/g, '');
    const full = dial ? `${dial} ${localVal}`.trim() : localVal;
    onChange(full);
  };

  const inputId = id || name || 'phone';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
        <div className="flex items-center bg-gray-50 border-r border-gray-200 min-w-[140px]">
          <img
            src={flagUrl(currentCountry.code)}
            alt=""
            className="w-7 h-5 object-cover shrink-0 rounded-sm ml-2 border border-gray-200"
            title={currentCountry.name}
          />
          <select
            aria-label="Pays (indicatif)"
            value={dial}
            onChange={handleCountryChange}
            disabled={disabled}
            className="w-full py-3 pl-2 pr-8 bg-transparent border-0 text-gray-700 text-sm font-medium focus:ring-0 focus:outline-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.dial} {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="tel"
          id={inputId}
          name={name}
          value={local}
          onChange={handleLocalChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={`flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none min-w-0 ${inputClassName}`}
        />
      </div>
    </div>
  );
}
