import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

// Logo component dùng lại được
export function LinkedInLogo({ size = 'md' }) {
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const badgeSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <span className={`text-primary font-bold ${textSize} flex items-center gap-1`}>
      Ho<span className={`bg-primary text-white rounded px-1 py-0.5 ${badgeSize}`}>pe</span>
    </span>
  );
}

export default function LandingNavbar() {
  const { t } = useTranslation();

  const navItems = [
    { icon: 'article', label: t('nav.articles') },
    { icon: 'people', label: t('nav.people') },
    { icon: 'ondemand_video', label: t('nav.learning') },
    { icon: 'work', label: t('nav.jobs') },
    { icon: 'extension', label: t('nav.games') },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface-light py-3 px-4 md:px-6 lg:px-24 border-b border-gray-200 flex items-center justify-between">
      {/* Logo */}
      <Link to="/"><LinkedInLogo size="lg" /></Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex gap-6 border-r border-gray-200 pr-6">
          {navItems.map(({ icon, label }) => (
            <div key={icon} className="icon-nav">
              <span className="material-icons">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" />
          <Link to="/dashboard">
            <button className="font-semibold text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md transition text-sm">
              {t('nav.joinNow')}
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="text-primary border border-primary font-semibold rounded-full px-5 py-2 hover:bg-blue-50 transition text-sm">
              {t('nav.signIn')}
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center gap-2">
        <LanguageSwitcher variant="compact" />
        <button className="text-gray-600"><span className="material-icons">menu</span></button>
      </div>
    </nav>
  );
}
