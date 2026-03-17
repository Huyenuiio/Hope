import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import LandingNavbar from '../components/LandingNavbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

function TagButton({ label }) {
  return (
    <a href="#" className="px-6 py-3 border border-gray-400 rounded-full font-semibold text-gray-600 hover:bg-gray-200 hover:border-gray-500 transition">
      {label}
    </a>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user, loginWithGoogle, loginWithEmail, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'client') navigate('/employer');
      else if (user.role === 'admin' || user.role === 'moderator') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleDevLogin = async () => {
    await loginWithEmail({ email: 'dev1@gmail.com', password: 'password123' });
  };

  const topicTags = t('landing.topics.tags', { returnObjects: true });
  const jobCategoryTags = t('landing.jobCategories.tags', { returnObjects: true });
  const softwareTags = t('landing.software.tags', { returnObjects: true });
  const gameTags = ['Pinpoint', 'Queens', 'Crossclimb'];
  const whoIsForItems = t('landing.whoIsFor.items', { returnObjects: true });
  const learnTopics = t('landing.learn.topics', { returnObjects: true });

  return (
    <div className="bg-background-light min-h-screen">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-24 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="w-full md:w-1/2 space-y-8">
          <h1 className="text-5xl md:text-6xl font-extralight text-orange-800 leading-tight">
            {t('landing.hero.title')}
          </h1>
          <div className="space-y-4 max-w-md">
            {/* Google Sign-In button — calls backend OAuth */}
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-400 rounded-full py-3 hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm"
            >
              <img alt="Google Logo" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6k-9BRUtIiPLxpQur8BOYEZ124zmvfQH2FZfgcTLNWDkQ3cQuVRUn7u7o6q9B0XI85k9KBtVQznyGqGmCscwXeVU0BWG0n3-Ipzsv0eRUArVWuDa2575cx8UicPOdNHqtf4q7blpKtGGZPwtGWtYO5GY6YQnl6VGYBMNmWN8o1S6g62C6BBJygVKwfSzipRN-5T_wNLXVfm-wmDWZfTqBg4cIrgLeTIaM3CB9FezP_x2-cWH7bwDjGTuM2vELbrTMHWc-Y1o60mo" />
              <span>{t('landing.hero.continueGoogle')}</span>
            </button>
            <button
              onClick={handleDevLogin}
              className="w-full border border-gray-400 rounded-full py-3 font-medium hover:bg-gray-50 transition"
            >
              {'Đăng nhập nhanh để test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            {t('landing.hero.agreement')}{' '}
            <a className="text-primary font-bold hover:underline" href="#">{t('landing.hero.userAgreement')}</a>,{' '}
            <a className="text-primary font-bold hover:underline" href="#">{t('landing.hero.privacyPolicy')}</a>, và{' '}
            <a className="text-primary font-bold hover:underline" href="#">{t('landing.hero.cookiePolicy')}</a>.
          </p>
          <div className="pt-4 text-lg">
            {t('landing.hero.newToLinkedIn')}{' '}
            <button onClick={loginWithGoogle} className="text-primary font-semibold hover:underline">{t('landing.hero.joinNow')}</button>
          </div>
        </div>
        <div className="w-full md:w-1/2 relative">
          <img
            alt="Professional working on laptop"
            className="w-full h-auto rounded-tl-[100px] rounded-br-[100px] object-cover shadow-2xl"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBALUxKlNO8w-X2NTCgEnW8iKpYSlrILo-XEsEIKed3Mq7trtMER9ehf3JEngH8c70nvyndJqi1fOiaOEVb00BEiSEJEsrUDEPbvw0Wl5_8zupehPDfLo60i5No55k83BFEHHSUsKDM47a2G_xzq-aZkVJYSl5HDuoJyaW_UP3woIfvpAVZog4OamoL5KVzobv5uzXNpDxOoroL7sJzcgdtQLvgP8pcwLGiDu163cUxUODZQOZRbef__Z93K7vXsC_ujeMEcAAWHwI"
          />
        </div>
      </section>

      {/* Topics + Job Categories */}
      <section className="bg-surface-light py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 space-y-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <h2 className="text-3xl md:text-4xl font-light">{t('landing.topics.title')}</h2>
              <p className="mt-4 text-gray-500 text-lg">{t('landing.topics.desc')}</p>
            </div>
            <div className="w-full md:w-2/3 flex flex-wrap gap-3 content-start">
              {Array.isArray(topicTags) && topicTags.map((tag) => <TagButton key={tag} label={tag} />)}
              <button className="px-6 py-3 bg-gray-100 rounded-full font-semibold text-primary hover:bg-gray-200 transition">{t('landing.topics.showAll')}</button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <h2 className="text-3xl md:text-4xl font-light">{t('landing.jobCategories.title')}</h2>
            </div>
            <div className="w-full md:w-2/3 flex flex-wrap gap-3 content-start">
              {Array.isArray(jobCategoryTags) && jobCategoryTags.map((tag) => <TagButton key={tag} label={tag} />)}
              <Link to="/jobs">
                <button className="px-6 py-3 border border-gray-400 rounded-full font-semibold text-gray-600 hover:bg-gray-200 transition flex items-center gap-1">
                  {t('landing.jobCategories.showMore')} <span className="material-icons text-sm">expand_more</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Post Job CTA */}
      <section className="bg-accent-light py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 flex flex-col md:flex-row items-center gap-8">
          <h2 className="text-3xl md:text-4xl text-orange-900 font-light flex-1">{t('landing.postJob.title')}</h2>
          <Link to="/employer">
            <button className="px-6 py-3 border border-orange-900 rounded-full font-semibold text-orange-900 hover:bg-orange-100 transition">{t('landing.postJob.btn')}</button>
          </Link>
        </div>
      </section>

      {/* Software + Games */}
      <section className="bg-background-light py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 space-y-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <h2 className="text-3xl md:text-4xl font-light">{t('landing.software.title')}</h2>
              <p className="mt-4 text-gray-500 text-lg">{t('landing.software.desc')}</p>
            </div>
            <div className="w-full md:w-2/3 flex flex-wrap gap-3 content-start">
              {Array.isArray(softwareTags) && softwareTags.map((tag) => <TagButton key={tag} label={tag} />)}
              <button className="px-6 py-3 bg-gray-100 rounded-full font-semibold text-primary hover:bg-gray-200 transition">{t('landing.software.showAll')}</button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <h2 className="text-3xl md:text-4xl font-light">{t('landing.games.title')}</h2>
              <p className="mt-4 text-gray-500 text-lg">{t('landing.games.desc')}</p>
            </div>
            <div className="w-full md:w-2/3 flex flex-wrap gap-3 content-start">
              {gameTags.map((tag) => <TagButton key={tag} label={tag} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Open To Work */}
      <section className="bg-accent-light py-16 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-light text-orange-800 leading-tight">{t('landing.openToWork.title')}</h2>
            <p className="text-xl font-light text-gray-700">{t('landing.openToWork.desc')}</p>
          </div>
          <div className="w-full md:w-1/2 flex justify-center relative">
            <div className="bg-black rounded-full h-[400px] w-[400px] absolute -top-10 opacity-10 blur-3xl"></div>
            <div className="relative z-10 w-72 md:w-80">
              <img
                alt="Phone showing open to work"
                className="rounded-[2rem] shadow-2xl border-4 border-white"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUGeS7_1Xm-lgTkXHZU3Q-Py8D1M7Ad5Bc1l6-4EmENcNZIHnCRoTQ-qQyCOdHT_inQf_rR-j5YO-XeO-GAvkFVZloLySoOfXGQICRPHitZsA43pjThtqxdm9GvHaCuhEsBcciVtXhGGQwWA0x5dQyIUD9Utz0px8SHTpjgdw2kVHp97FnwMG7kyg2paBAJxpuQ6_DnYyyFIFLQ02KS_NnoZ3zeCrIR7n79t9VMtDJrJgGaFk2QDME_2eg4dpDnswZMXaRkN1evts"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[88%] h-[94%] bg-white rounded-[1.5rem] overflow-hidden flex flex-col items-center pt-8 px-4 text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-green-500 p-0.5">
                    <img className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDofWOSoPTCBBUZDd7wE7SLCOaWAahiQXm2AaBsC-yxbuWY9e9UGZfSyHJOXlXEXoVOhysO_-2v7_wKssM5pImOGVVdX97jPhslKQjc--uryE708QB78HCAjhz0OUJrPaV1AxDwWHLJ9azsy7hPG50_UWcEqYHQXuZ0iDKdg7S7iN6LnMJ1MdX_2n-wcNAwz4aUpU1jVddmCGkAL1HeEVYqz80ohhlg9PTAbH2IZwhqKbihy2G5yP6bbVVQhft3_50E-2Zjw5FQCE0" alt="Arturo" />
                  </div>
                  <div className="mt-4 font-bold text-gray-800">Arturo Fuentes</div>
                  <div className="text-xs text-gray-500">Engineer</div>
                  <div className="mt-4 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">#OpenToWork</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connect + Learn */}
      <section className="bg-background-light py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 grid md:grid-cols-2 gap-12">
          <div className="flex flex-col items-start gap-6">
            <div className="relative w-full aspect-[4/3] max-w-sm">
              <img alt="People connecting" className="object-cover w-full h-full rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-_WlkCPkyIPxRKWRUbJXWu0GfGA1mUxdvI_Vy9AVhkFyMN8TBJishP9UKnLoaL3a425wsFU3T2lVA4cvSYx-g6iNJwqf7tkswfDrP8LVIY02q4WNvc0GfhCxPVW5K1eGYXiDSseMGgLWKKWTTiS8Tzp54Bk14lH3yzPR9JxSf4OHL_RHEZsbmjMUvBPn5QV4bDp-DBcsTUG8j9I0EvGPWb_rz1cvuWEVgrK3SFVEJduoG0pG3BVfVzJ8k9M94jXdUCy8vEuUpBgI" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light">{t('landing.connect.title')}</h2>
            <Link to="/dashboard">
              <button className="px-6 py-3 border border-gray-400 rounded-full font-semibold text-gray-600 hover:bg-gray-100 transition">{t('landing.connect.btn')}</button>
            </Link>
          </div>
          <div className="flex flex-col items-start gap-6">
            <div className="relative w-full aspect-[4/3] max-w-sm">
              <img alt="Learning skills" className="object-cover w-full h-full rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVXCXQWPeLbjzRC303Bhf3LzOO0BlZYSbe-to2VJ7upPS2c_2kCeMZT-V8eJHZ7AkgeuHe-UWrkPJCpXwZL7sFl24DWdQnKpPZiosqDAov_vLBlS2YZVTDh13EfiLuEPdaVMOtgpNR0OcKY8uytzLpBJ03NPf4oVnQsfl-PKXVdhX8DY7Ya4MIUj0dT0RV57B4sSA6XXsPDH8Etp39B2P-rCefOYARQSaUzmaAHswSy2VhbDn08PSyrmeu0ZTrGKQHxrOAO8zviIE" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light">{t('landing.learn.title')}</h2>
            <div className="relative w-full max-w-sm">
              <select className="w-full appearance-none border border-gray-400 rounded-md py-3 px-4 bg-transparent text-gray-700 font-medium focus:ring-2 focus:ring-primary cursor-pointer">
                <option value="">{t('landing.learn.chooseTopic')}</option>
                {Array.isArray(learnTopics) && learnTopics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <span className="material-icons text-gray-500">expand_more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is LinkedIn For */}
      <section className="bg-surface-light py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-24 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-4xl font-light text-orange-900">{t('landing.whoIsFor.title')}</h2>
            <p className="text-xl text-gray-600 font-light">{t('landing.whoIsFor.desc')}</p>
            <div className="space-y-3 mt-8">
              {Array.isArray(whoIsForItems) && whoIsForItems.map((item) => (
                <button key={item} className="w-full flex justify-between items-center p-4 bg-orange-100 hover:bg-orange-200 rounded-md transition text-left font-medium text-gray-800">
                  {item}<span className="material-icons text-gray-500">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <img alt="Students collaborating" className="w-full h-full object-cover rounded-lg shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVk-pTxAZvqzL5AlukYGxf4dj_X2mLc3u71qrbq5xSBSWnt39INIptY4ZeN7lTKrQLJeOpMctawj6iVBZLiBOjLMLDwn682xQNYslHeFnnAGW5KIzZFw92bY1kPrglE2eE8HCq9vHA7rh_yxYxMnpP_nWizXx6_1msfsEg0ZxL_fU5HQi6Of0LDbIKEOm2ji42B-6lUBzpwrVWUHzB-GmAAjZzjQqIrp2DfvJNKRXPMrtu8IAp0em22bCpKX_mFW9gAjoqVxpwxmQ" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img alt="Cityscape background" className="w-full h-full object-cover opacity-20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjRAbGmRxroKFrssl7ddHLyf-lfHS1KGCfMeFczPtbUCkyO9newfr10t651hVepwjezCHqYVMlv8geDnp6YN_vQgabSwWr3FJsl2jTehyjevxQt9CbhNFad_ZuXNxhm_Xyj2iqzjBeSjwltp-J9e731Du72Jfv6h04WM-1-K--VBeD7ZcTiuroJdK8sovw56KWurOoGd5xgNAIvvggkaOhDhawtyGWDqu2I7kLVEbIx8VxUm5p6bhzTss8tPyVGY_kVwgCKJxghKA" />
          <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-24 w-full">
          <h2 className="text-4xl md:text-5xl font-light text-gray-800 max-w-2xl mb-8">{t('landing.cta.title')}</h2>
          <button
            onClick={loginWithGoogle}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3.5 rounded-full shadow-lg transition text-lg"
          >
            {t('landing.cta.btn')}
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
