import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const { t } = useTranslation();

  const sections = [
    { title: t('footer.general'), links: t('footer.generalLinks', { returnObjects: true }) },
    { title: t('footer.browseHope'), links: t('footer.browseLinks', { returnObjects: true }) },
    { title: t('footer.businessSolutions'), links: t('footer.businessLinks', { returnObjects: true }) },
    { title: t('footer.directories'), links: t('footer.directoriesLinks', { returnObjects: true }) },
  ];

  const bottomLinks = t('footer.bottomLinks', { returnObjects: true });

  return (
    <footer className="bg-surface-light pt-12 pb-4 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-primary font-bold text-2xl flex items-center gap-1">
            Ho<span className="bg-primary text-white rounded px-1 text-xl">pe</span>
          </span>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
              {Array.isArray(section.links) && section.links.map((link) => (
                <a key={link} href="#" className="block text-gray-600 hover:text-primary hover:underline">{link}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 pt-8 border-t border-gray-300 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              Ho<span className="bg-primary text-white rounded px-0.5 ml-0.5">pe</span>
            </span>
            <span>© 2024</span>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {Array.isArray(bottomLinks) && bottomLinks.map((item) => (
              <a key={item} href="#" className="hover:underline hover:text-primary">{item}</a>
            ))}
          </div>
          <div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
