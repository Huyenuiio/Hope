import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export default function LanguageSwitcher({ variant = 'default' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const switchLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setOpen(false);
  };

  // Compact variant (for navbar)
  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 hover:border-primary hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 group"
        >
          <span className="text-base">{currentLang.flag}</span>
          <span className="hidden sm:block">{currentLang.code.toUpperCase()}</span>
          <span className="material-icons text-sm text-gray-500 group-hover:text-primary transition-colors">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="py-1">
                {languages.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => switchLanguage(code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${i18n.language === code
                        ? 'bg-blue-50 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-lg">{flag}</span>
                    <span>{label}</span>
                    {i18n.language === code && (
                      <span className="material-icons text-base ml-auto text-primary">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant (for footer / standalone)
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 cursor-pointer hover:underline text-sm"
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <span className="material-icons text-sm align-middle">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="py-1">
              {languages.map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => switchLanguage(code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${i18n.language === code
                      ? 'bg-blue-50 text-primary font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="text-lg">{flag}</span>
                  <span>{label}</span>
                  {i18n.language === code && (
                    <span className="material-icons text-base ml-auto text-primary">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
