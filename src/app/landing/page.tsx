"use client";

import {
  Syringe,
  Users,
  CheckCircle2,
  MessageCircle,
  Instagram,
  Menu,
  User,
  Phone,
  MapPin,
  Star,
  X,
  UserPlus,
  Heart,
  Image as ImageIcon,
  Mail,
  Clock,
  Shield,
  Zap,
  Building2,
  Banknote,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { I18nextProvider, Trans } from "react-i18next";
import {
  partnerClinics,
  testimonials,
  companyInfo,
} from "./content";
import i18n, { detectLocale, useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Gallery Image Component with Next.js Image optimization
function GalleryImage({ index }: { index: number }) {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageNumber = index + 1;

  if (hasError) {
    // Don't render placeholder if image fails - keeps grid clean
    return null;
  }

  return (
    <div className="aspect-square bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer group relative">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
          <div
            className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ animation: "shimmer 1.5s infinite" }}
          />
        </div>
      )}
      <Image
        src={`/gallery/image-${imageNumber}.jpg`}
        alt={`Gallery image ${imageNumber}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        className={`object-cover transition-opacity duration-500 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onError={() => setHasError(true)}
        onLoad={() => setImageLoaded(true)}
        loading="lazy"
        quality={90}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQADAQEBAAAAAAAAAAAAAAABAgMAETH/2gAMAwEAAhEDEQA/ANB6f6ouNS1O2huLWGONySoRiTwODz+1J3frC8tbueCO0t2WKRkBZjk4JGT7+0pTqpEwMjmT1LP/2Q=="
      />
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  // Suppress first paint until locale is confirmed — prevents English flash
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    // Match the original landing behaviour: stored preference, then browser language.
    i18n.changeLanguage(detectLocale());
    setLocaleReady(true);
  }, []);

  // Prevent autoscroll on page load
  useEffect(() => {
    // Prevent scroll restoration first
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Force scroll to top immediately and after a short delay
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dynamically generate carousel slides from available images (up to 11)
  const carouselSlides: Array<{
    image: string;
    bgGradient: string;
  }> = Array.from({ length: 11 }, (_, index) => {
    const slideNumber = index + 1;
    const gradients = [
      "from-blue-900 via-green-900 to-blue-800",
      "from-green-800 via-blue-800 to-purple-900",
      "from-purple-900 via-blue-900 to-teal-900",
      "from-blue-800 via-indigo-900 to-purple-900",
      "from-teal-900 via-green-800 to-blue-900",
      "from-indigo-900 via-purple-900 to-pink-900",
      "from-green-900 via-teal-900 to-cyan-900",
      "from-blue-900 via-indigo-900 to-purple-900",
      "from-purple-900 via-pink-900 to-red-900",
      "from-cyan-900 via-blue-900 to-indigo-900",
      "from-green-900 via-emerald-900 to-teal-900",
    ];
    return {
      image: `/carousel/slide-${slideNumber}.jpg`,
      bgGradient: gradients[(slideNumber - 1) % gradients.length],
    };
  });

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length,
    );
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      {/* Hold render until locale is confirmed to prevent English flash */}
      {!localeReady ? null : (
        <div className="min-h-screen bg-white">
          {/* Navigation Bar - Transparent with backdrop blur */}
          <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
              scrolled
                ? "bg-white/95 backdrop-blur-md shadow-md"
                : "bg-white/10 backdrop-blur-sm"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                <div className="flex items-center">
                  <a
                    href="#home"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center"
                  >
                    <img
                      src="/logo.png"
                      alt="MenoDAO Logo"
                      className={`h-10 w-10 md:h-12 md:w-12 transition-all duration-300 ${
                        !scrolled ? "drop-shadow-lg" : ""
                      }`}
                      style={
                        !scrolled
                          ? {
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))",
                            }
                          : {}
                      }
                      onError={(e) => {
                        e.currentTarget.src = "/logo.svg";
                      }}
                    />
                  </a>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("about");
                    }}
                    className={`transition-colors duration-200 font-medium ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] hover:text-blue-200"
                    }`}
                  >
                    {t("nav.about")}
                  </a>
                  <a
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("services");
                    }}
                    className={`transition-colors duration-200 font-medium ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] hover:text-blue-200"
                    }`}
                  >
                    {t("nav.services")}
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("how-it-works");
                    }}
                    className={`transition-colors duration-200 font-medium ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] hover:text-blue-200"
                    }`}
                  >
                    {t("nav.howItWorks")}
                  </a>
                  <a
                    href="#gallery"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("gallery");
                    }}
                    className={`transition-colors duration-200 font-medium ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] hover:text-blue-200"
                    }`}
                  >
                    {t("nav.gallery")}
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("contact");
                    }}
                    className={`transition-colors duration-200 font-medium ${
                      scrolled
                        ? "text-gray-700 hover:text-blue-600"
                        : "text-white drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] hover:text-blue-200"
                    }`}
                  >
                    {t("nav.contact")}
                  </a>
                  <a
                    href="https://app.menodao.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {t("nav.getStarted")}
                  </a>
                </nav>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden p-2 rounded-lg transition-all ${
                    scrolled
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 shadow-lg"
                  }`}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div
                  className={`md:hidden py-4 animate-slideDown ${
                    scrolled
                      ? "border-t border-gray-200 bg-white"
                      : "border-t border-white/20 bg-black/30 backdrop-blur-md"
                  }`}
                >
                  <nav className="flex flex-col space-y-4">
                    <a
                      href="#about"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("about");
                      }}
                      className={`transition-colors duration-200 font-medium py-2 ${
                        scrolled
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      {t("nav.about")}
                    </a>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("services");
                      }}
                      className={`transition-colors duration-200 font-medium py-2 ${
                        scrolled
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      {t("nav.services")}
                    </a>
                    <a
                      href="#how-it-works"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("how-it-works");
                      }}
                      className={`transition-colors duration-200 font-medium py-2 ${
                        scrolled
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      {t("nav.howItWorks")}
                    </a>
                    <a
                      href="#gallery"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("gallery");
                      }}
                      className={`transition-colors duration-200 font-medium py-2 ${
                        scrolled
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      {t("nav.gallery")}
                    </a>
                    <a
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("contact");
                      }}
                      className={`transition-colors duration-200 font-medium py-2 ${
                        scrolled
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      {t("nav.contact")}
                    </a>
                    <a
                      href="https://app.menodao.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-center shadow-lg"
                    >
                      {t("nav.getStarted")}
                    </a>
                  </nav>
                </div>
              )}
            </div>
          </nav>

          {/* Hero Carousel Section - Fullscreen */}
          <section id="home" className="relative h-screen overflow-hidden">
            {/* Carousel Container */}
            <div
              className="relative w-full h-full"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {carouselSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  {/* Background Image with Fallback Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient}`}
                  >
                    <Image
                      src={slide.image}
                      alt={`Slide ${index + 1}`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority={index < 3} // Preload first 3 slides for smooth transitions
                      quality={90}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQADAQEBAAAAAAAAAAAAAAABAgMAETH/2gAMAwEAAhEDEQA/ANB6f6ouNS1O2huLWGONySoRiTwODz+1J3frC8tbueCO0t2WKRkBZjk4JGT7+0pTqpEwMjmT1LP/2Q=="
                      onError={(e) => {
                        // Hide image if it fails to load, gradient background will show
                        (e.target as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                    {/* Dark Overlay for Text Legibility */}
                    <div className="absolute inset-0 bg-black/50 md:bg-black/40"></div>
                    {/* Gradient Overlay for Better Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  </div>

                  {/* Content Overlay */}
                  <div className="relative z-20 h-full flex items-center justify-center pt-56 sm:pt-44 pb-20 md:pt-48 md:pb-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                      <div className="text-center space-y-4 md:space-y-6">
                        {/* Pre-Header */}
                        <p className="text-xs sm:text-sm md:text-base text-emerald-400 uppercase tracking-wider font-semibold drop-shadow-lg bg-emerald-900/40 px-4 py-2 rounded-full inline-block">
                          {t("hero.servingBadge")}
                        </p>

                        {/* Headline with Text Shadow for Legibility */}
                        <div className="space-y-2 md:space-y-4">
                          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight font-outfit text-white drop-shadow-2xl [text-shadow:_2px_2px_8px_rgb(0_0_0_/_80%)]">
                            {t("hero.headline")}
                          </h1>
                        </div>

                        {/* Simplified Value Proposition */}
                        <p className="text-base sm:text-lg md:text-xl text-white leading-relaxed drop-shadow-lg [text-shadow:_1px_1px_3px_rgb(0_0_0_/_80%)] max-w-2xl mx-auto">
                          {t("hero.subheadline")}
                        </p>

                        {/* Trust Badges - Partner Clinics */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-white/95">
                          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                            <Building2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium">
                              {t("hero.partneredClinics", {
                                count: partnerClinics.length,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium">
                              {t("hero.joinMembers")}
                            </span>
                          </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
                          <a
                            href="https://app.menodao.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto max-w-sm px-10 py-5 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-all duration-200 shadow-2xl hover:shadow-green-500/50 hover:scale-105 text-center"
                          >
                            {t("hero.ctaText")}
                          </a>
                          <a
                            href="https://wa.me/254743178950?text=Hi%20MenoDAO%2C%20I%20need%20treatment%20support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto max-w-sm px-10 py-5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/40 text-white text-lg font-bold rounded-xl transition-all duration-200 text-center"
                          >
                            {t("hero.ctaSecondary")}
                          </a>
                        </div>
                        <a
                          href="https://wa.me/254743178950"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white text-sm underline"
                        >
                          {t("hero.ctaSubtext")}
                        </a>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4 pb-8 md:pb-4 md:pt-6 text-white/90 text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{t("hero.trustMembers")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("hero.trustTransparent")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>{t("hero.trustOwned")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slide Indicators - Hidden */}
              <div className="hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-30 gap-2">
                {carouselSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${
                      index === currentSlide
                        ? "w-12 h-3 bg-white shadow-lg"
                        : "w-3 h-3 bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* M-Pesa Trust Badge Section */}
          <section className="py-8 bg-gradient-to-r from-green-50 to-emerald-50 border-y-2 border-green-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <div className="relative w-48 h-20">
                    <Image
                      src="/mpesa-logo.png"
                      alt="Lipa na M-PESA Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-green-300"></div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    {t("mpesa.instantActivation")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    {t("mpesa.cancelAnytime")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-20 md:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm inline-block">
                  {t("howItWorks.badge")}
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-4 leading-tight font-outfit">
                  {t("howItWorks.title")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                    {t("howItWorks.titleHighlight")}
                  </span>
                </h2>
                <p className="text-slate-500 mt-6 text-lg max-w-2xl mx-auto">
                  {t("howItWorks.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                <div className="text-center md:text-left space-y-4">
                  <div className="w-16 h-16 mx-auto md:mx-0 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <Banknote className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-outfit">
                    {t("howItWorks.step1Title")}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t("howItWorks.step1Desc")}
                  </p>
                </div>
                <div className="text-center md:text-left space-y-4">
                  <div className="w-16 h-16 mx-auto md:mx-0 bg-white border-4 border-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-outfit">
                    {t("howItWorks.step2Title")}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t("howItWorks.step2Desc")}
                  </p>
                </div>
                <div className="text-center md:text-left space-y-4">
                  <div className="w-16 h-16 mx-auto md:mx-0 bg-gradient-to-br from-blue-600 to-blue-800 border-4 border-white rounded-full flex items-center justify-center shadow-xl shadow-blue-900/30">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-outfit">
                    {t("howItWorks.step3Title")}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t("howItWorks.step3Desc")}
                  </p>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md inline-block">
                    {t("howItWorks.step3Highlight")}
                  </span>
                </div>
              </div>

              <div className="text-center mt-12">
                <a
                  href="https://app.menodao.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 bg-[#22C55E] hover:bg-green-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg text-lg"
                >
                  {t("howItWorks.getStarted")}
                </a>
              </div>
            </div>
          </section>

          {/* Partner Clinics Section - CRITICAL TRUST SIGNAL */}
          <section className="py-12 md:py-16 bg-white border-b-2 border-green-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {t("partnerClinics.title")}
                </h2>
                <p className="text-gray-600">{t("partnerClinics.subtitle")}</p>
              </div>

              {/* Clinics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {partnerClinics.map((clinic, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 rounded-full p-2 shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          {clinic.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {clinic.location}
                        </p>
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {clinic.area}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Statement */}
              <div className="text-center bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <p className="text-gray-700 font-medium">
                  <CheckCircle2 className="inline h-5 w-5 text-green-600 mr-2" />
                  {t("partnerClinics.noCardNeeded")}
                </p>
              </div>
            </div>
          </section>

          {/* CEO Message Section */}
          <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                    {t("ceo.sectionTitle")}
                  </h2>
                </div>

                {/* CEO Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* CEO Photo */}
                    <div className="shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <User className="h-12 w-12 md:h-16 md:w-16 text-white" />
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-4xl md:text-5xl text-blue-600 mb-4">
                        "
                      </div>
                      <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                        {t("ceo.quote")}
                      </p>
                      <div className="border-t border-gray-200 pt-6">
                        <p className="font-bold text-gray-900 text-lg">
                          {t("ceo.name")}
                        </p>
                        <p className="text-gray-600">{t("ceo.title")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compare Plans Section - NEW */}
          <section className="py-16 md:py-24 bg-white border-b-4 border-emerald-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 font-outfit mb-4">
                  {t("plans.title")}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                  {t("plans.subtitle")}
                </p>
              </div>

              {/* Comparison Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {/* Bronze Plan */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-xl">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-amber-100 px-4 py-1 rounded-full text-amber-800 text-sm font-bold mb-4">
                      {t("plans.bronze.badge")}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("plans.bronze.name")}
                    </h3>
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {t("plans.bronze.price")}
                      <span className="text-xl text-gray-600">
                        {t("plans.bronze.perMonth")}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {t("plans.bronze.bestFor")}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.bronze.feature1Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.bronze.feature1Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.bronze.feature2Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.bronze.feature2Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.bronze.feature3Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.bronze.feature3Desc")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://app.menodao.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center transition-all hover:scale-105"
                  >
                    {t("plans.bronze.cta")}
                  </a>
                </div>

                {/* Silver Plan */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-4 border-blue-400 hover:border-blue-500 transition-all hover:shadow-2xl relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    {t("plans.mostPopular")}
                  </div>

                  <div className="text-center mb-6 mt-4">
                    <div className="inline-block bg-blue-100 px-4 py-1 rounded-full text-blue-800 text-sm font-bold mb-4">
                      {t("plans.silver.badge")}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("plans.silver.name")}
                    </h3>
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {t("plans.silver.price")}
                      <span className="text-xl text-gray-600">
                        {t("plans.silver.perMonth")}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {t("plans.silver.bestFor")}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.silver.feature1Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.silver.feature1Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.silver.feature2Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.silver.feature2Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.silver.feature3Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.silver.feature3Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.silver.feature4Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.silver.feature4Desc")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://app.menodao.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-all hover:scale-105 shadow-lg"
                  >
                    {t("plans.silver.cta")}
                  </a>
                </div>

                {/* Gold Plan */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-orange-300 hover:border-orange-400 transition-all hover:shadow-xl">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-orange-100 px-4 py-1 rounded-full text-orange-800 text-sm font-bold mb-4">
                      {t("plans.gold.badge")}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t("plans.gold.name")}
                    </h3>
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {t("plans.gold.price")}
                      <span className="text-xl text-gray-600">
                        {t("plans.gold.perMonth")}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {t("plans.gold.bestFor")}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.gold.feature1Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.gold.feature1Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.gold.feature2Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.gold.feature2Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.gold.feature3Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.gold.feature3Desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("plans.gold.feature4Title")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("plans.gold.feature4Desc")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://app.menodao.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-center transition-all hover:scale-105"
                  >
                    {t("plans.gold.cta")}
                  </a>
                </div>
              </div>

              {/* Real-World Example */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 md:p-12 border-2 border-emerald-200">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                  {t("plans.savings.title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <X className="h-6 w-6 text-red-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {t("plans.savings.withoutTitle")}
                      </h4>
                    </div>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        • {t("plans.savings.toothache")}{" "}
                        <span className="font-bold text-red-600">
                          KES 5,000
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.filling")}{" "}
                        <span className="font-bold text-red-600">
                          KES 8,000
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.cleaning")}{" "}
                        <span className="font-bold text-red-600">
                          KES 3,000
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.checkup")}{" "}
                        <span className="font-bold text-red-600">
                          KES 2,000
                        </span>
                      </p>
                      <div className="border-t-2 border-gray-200 pt-3 mt-3">
                        <p className="text-xl font-bold text-red-600">
                          {t("plans.savings.withoutTotal")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-emerald-400">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {t("plans.savings.withTitle")}
                      </h4>
                    </div>
                    <div className="space-y-3 text-gray-700">
                      <p>
                        • {t("plans.savings.toothache")}{" "}
                        <span className="font-bold text-emerald-600">
                          {t("plans.savings.included")}
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.filling")}{" "}
                        <span className="font-bold text-emerald-600">
                          {t("plans.savings.included")}
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.cleaning")}{" "}
                        <span className="font-bold text-emerald-600">
                          {t("plans.savings.included")}
                        </span>
                      </p>
                      <p>
                        • {t("plans.savings.checkup")}{" "}
                        <span className="font-bold text-emerald-600">
                          {t("plans.savings.unlimited")}
                        </span>
                      </p>
                      <div className="border-t-2 border-emerald-200 pt-3 mt-3">
                        <p className="text-xl font-bold text-emerald-600">
                          {t("plans.savings.withTotal")}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {t("plans.savings.withYearly")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-lg font-bold text-gray-900 mt-8">
                  <Trans
                    i18nKey="plans.savings.savingsMessage"
                    components={{
                      highlight: (
                        <span className="text-emerald-600" />
                      ),
                    }}
                  />
                </p>
              </div>

              {/* Not Sure CTA */}
              <div className="text-center mt-12">
                <p className="text-gray-600 mb-4">{t("plans.notSure")}</p>
                <a
                  href="https://chat.whatsapp.com/ItBoBWNdvPG7LGt8Ieu13C?mode=wwt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("plans.chatWhatsApp")}
                </a>
              </div>
            </div>
          </section>

          {/* Why MenoDAO Section */}
          <section className="py-20 md:py-32 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-4 mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit">
                  {t("whyMenodao.title")}
                </h2>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                  {t("whyMenodao.subtitle")}
                </p>
              </div>

              {/* Three-Column Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Card 1: Pay Small, Small */}
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                    <Banknote className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 font-outfit">
                    {t("whyMenodao.card1Title")}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {t("whyMenodao.card1Desc")}
                  </p>
                  <p className="text-emerald-600 font-bold">
                    {t("whyMenodao.card1Highlight")}
                  </p>
                </div>

                {/* Card 2: Catch Problems Early */}
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-2 border-[#F97316]">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
                    <Syringe className="h-8 w-8 text-[#F97316]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 font-outfit">
                    {t("whyMenodao.card2Title")}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {t("whyMenodao.card2Desc")}
                  </p>
                  <p className="text-orange-600 font-bold">
                    {t("whyMenodao.card2Highlight")}
                  </p>
                </div>

                {/* Card 3: Your Community, Your Rules */}
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 font-outfit">
                    {t("whyMenodao.card3Title")}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {t("whyMenodao.card3Desc")}
                  </p>
                  <p className="text-blue-600 font-bold">
                    {t("whyMenodao.card3Highlight")}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-12">
                <a
                  href="https://app.menodao.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition-all hover:scale-105 shadow-xl"
                >
                  {t("whyMenodao.cta")}
                </a>
                <p className="text-gray-500 text-sm mt-4">
                  {t("whyMenodao.ctaSubtext")}
                </p>
              </div>
            </div>
          </section>

          {/* Chama Rules Transparency Section */}
          <section className="py-20 md:py-32 bg-white border-t-4 border-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Section Header */}
              <div className="text-center mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {t("chamaRules.badge")}
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-4">
                  {t("chamaRules.title")}
                </h2>
                <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
                  {t("chamaRules.subtitle")}
                </p>
              </div>

              {/* Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Coverage Start Times Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t("chamaRules.coverageTitle")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.emergencyTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.emergencyDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.majorTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.majorDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Coverage Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t("chamaRules.instantTitle")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.upfrontTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.upfrontDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.zeroWaitTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.zeroWaitDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Money Safety Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t("chamaRules.moneyTitle")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.treasuryTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.treasuryDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.auditedTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.auditedDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Community Governance Card */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {t("chamaRules.memberOwnedTitle")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-orange-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.voiceTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.voiceDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-orange-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("chamaRules.noFeesTitle")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("chamaRules.noFeesDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Statement */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {t("chamaRules.trustTitle")}
                </h3>
                <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
                  {t("chamaRules.trustDesc")}
                </p>
              </div>
            </div>
          </section>

          {/* Transparent Technology Section */}
          <section className="py-20 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Title */}
              <div className="text-center mb-12 md:mb-16">
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-widest">
                  {t("technology.badge")}
                </p>
              </div>

              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                {/* Left: Text Content */}
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit">
                    {t("technology.title")}
                  </h2>

                  {/* Feature List */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <CheckCircle2 className="h-6 w-6 text-[#22C55E] shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                          {t("technology.ledgerTitle")}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {t("technology.ledgerDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <CheckCircle2 className="h-6 w-6 text-[#22C55E] shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                          {t("technology.privacyTitle")}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {t("technology.privacyDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <CheckCircle2 className="h-6 w-6 text-[#22C55E] shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                          {t("technology.paymentsTitle")}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {t("technology.paymentsDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Phone Mockup */}
                <div className="flex items-center justify-center">
                  <div className="relative w-64 md:w-80 h-[500px] md:h-[600px]">
                    {/* Phone Frame */}
                    <div className="absolute inset-0 bg-gray-900 rounded-[3rem] p-3 md:p-4 shadow-2xl">
                      {/* Phone Screen */}
                      <div className="w-full h-full bg-gray-800 rounded-[2.5rem] p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Card with Blue Background */}
                        <div className="w-full bg-[#3B82F6] rounded-2xl p-6 md:p-8 text-white space-y-4">
                          <div className="text-sm md:text-base text-blue-100">
                            {t("technology.balanceLabel")}
                          </div>
                          <div className="text-3xl md:text-4xl font-bold">
                            KES 500
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="bg-[#22C55E] text-white text-xs md:text-sm font-semibold px-3 py-1 rounded-full">
                              {t("technology.activeMember")}
                            </span>
                          </div>
                        </div>

                        {/* Floating Orange Button */}
                        <div className="absolute bottom-6 right-6 w-12 h-12 md:w-14 md:h-14 bg-[#F97316] rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-2xl md:text-3xl font-bold">
                            +
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payments & Compliance */}
          <section
            id="payments-compliance"
            className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-emerald-50 border-y border-emerald-100"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                {t("paymentsCompliance.badge")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 font-outfit">
                {t("paymentsCompliance.title")}
              </h2>
              <div className="mt-8 space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>{t("paymentsCompliance.body1")}</p>
                <p className="font-semibold text-gray-900">
                  {t("paymentsCompliance.body2")}
                </p>
                <p>{t("paymentsCompliance.body3")}</p>
              </div>
              <Link
                href="/compliance"
                className="inline-block mt-8 text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-4"
              >
                {t("paymentsCompliance.readMore")}
              </Link>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-20 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm inline-block mb-4">
                  {t("about.badge")}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit mt-4">
                  {t("about.title")}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {t("about.desc1")}
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {t("about.desc2")}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-8">
                    <div className="bg-blue-50 rounded-lg p-4 flex-1 min-w-[150px]">
                      <div className="text-3xl font-bold text-blue-600">
                        2025
                      </div>
                      <div className="text-sm text-gray-600">
                        {t("about.founded")}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 flex-1 min-w-[150px]">
                      <div className="text-3xl font-bold text-green-600">
                        100%
                      </div>
                      <div className="text-sm text-gray-600">
                        {t("about.communityOwned")}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 flex-1 min-w-[150px]">
                      <div className="text-3xl font-bold text-orange-600">
                        KES 300+
                      </div>
                      <div className="text-sm text-gray-600">
                        {t("about.monthlyStart")}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden min-h-[400px] shadow-xl">
                  <Image
                    src="/gallery/image-1.jpg"
                    alt="MenoDAO Community"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                    quality={90}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQADAQEBAAAAAAAAAAAAAAABAgMAETH/2gAMAwEAAhEDEQA/ANB6f6ouNS1O2huLWGONySoRiTwODz+1J3frC8tbueCO0t2WKRkBZjk4JGT7+0pTqpEwMjmT1LP/2Q=="
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section id="services" className="py-20 md:py-32 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm inline-block mb-4">
                  {t("services.badge")}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit mt-4">
                  {t("services.title")}
                </h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                  {t("services.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Bronze Package */}
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="text-center mb-6">
                    <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 font-outfit mb-2">
                      {t("services.bronze.name")}
                    </h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {t("services.bronze.price")}
                      <span className="text-lg text-gray-500 font-normal">
                        {t("services.bronze.perMonth")}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.bronze.feature1")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.bronze.feature2")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.bronze.feature3")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Silver Package */}
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200">
                  <div className="text-center mb-6">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 font-outfit mb-2">
                      {t("services.silver.name")}
                    </h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {t("services.silver.price")}
                      <span className="text-lg text-gray-500 font-normal">
                        {t("services.silver.perMonth")}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.silver.feature1")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.silver.feature2")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.silver.feature3")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.silver.feature4")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Gold Package */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-orange-300">
                  <div className="text-center mb-6">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 font-outfit mb-2">
                      {t("services.gold.name")}
                    </h3>
                    <div className="text-sm font-semibold text-orange-600 mb-2">
                      {t("services.recommended")}
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {t("services.gold.price")}
                      <span className="text-lg text-gray-500 font-normal">
                        {t("services.gold.perMonth")}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.gold.feature1")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.gold.feature2")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.gold.feature3")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {t("services.gold.feature4")}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section - SOCIAL PROOF */}
          <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {t("testimonials.badge")}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
                  {t("testimonials.title")}
                </h2>
                <p className="text-lg text-gray-600 mt-4">
                  {t("testimonials.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-green-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {testimonial.treatment}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {t("testimonials.saved", {
                          amount: testimonial.savings,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-12">
                <a
                  href="https://app.menodao.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-5 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-all hover:scale-105 shadow-xl"
                >
                  {t("testimonials.cta")}
                </a>
              </div>
            </div>
          </section>

          {/* Gallery Section */}
          <section id="gallery" className="py-20 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm inline-block mb-4">
                  {t("gallery.badge")}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit mt-4">
                  {t("gallery.title")}
                </h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                  {t("gallery.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Gallery images - Will try to load from /gallery/ directory (up to 16 images) */}
                {Array.from({ length: 16 }).map((_, index) => (
                  <GalleryImage key={index} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20 md:py-32 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm inline-block mb-4">
                  {t("contact.badge")}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-outfit mt-4">
                  {t("contact.title")}
                </h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                  {t("contact.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                {/* Option 1: Sign Up Directly */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-300 hover:border-emerald-400 transition-all">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 font-outfit mb-4 text-center">
                    {t("contact.signUpTitle")}
                  </h3>
                  <p className="text-gray-700 mb-6 text-center leading-relaxed">
                    {t("contact.signUpDesc")}
                  </p>
                  <a
                    href="https://app.menodao.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl text-center transition-all hover:scale-105 shadow-lg"
                  >
                    {t("contact.signUpCta")}
                  </a>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    {t("contact.signUpNote")}
                  </p>
                </div>

                {/* Option 2: Join WhatsApp First */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-green-300 hover:border-green-400 transition-all">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 font-outfit mb-4 text-center">
                    {t("contact.whatsappTitle")}
                  </h3>
                  <p className="text-gray-700 mb-6 text-center leading-relaxed">
                    {t("contact.whatsappDesc")}
                  </p>
                  <a
                    href="https://wa.me/254743178950?text=Hi%2C%20I%20want%20to%20join%20the%20MenoDAO%20WhatsApp%20community"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl text-center transition-all hover:scale-105 shadow-lg"
                  >
                    {t("contact.whatsappCta")}
                  </a>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    {t("contact.whatsappNote")}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/254743178950"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
                >
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-outfit mb-2">
                    {t("contact.whatsappLabel")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {t("contact.whatsappPhone")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("contact.whatsappQuick")}
                  </p>
                </a>

                {/* Location */}
                <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-outfit mb-2">
                    {t("contact.locationLabel")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {t("contact.locationCity")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("contact.locationServing")}
                  </p>
                </div>

                {/* Email */}
                <a
                  href="mailto:info@menodao.org"
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
                >
                  <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-outfit mb-2">
                    {t("contact.emailLabel")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {t("contact.emailAddress")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("contact.emailInquiries")}
                  </p>
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#0F172A] text-white py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Top Section */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center mb-4 md:mb-0">
                  <img
                    src="/logo.png"
                    alt="MenoDAO Logo"
                    className="h-10 w-10 md:h-12 md:w-12"
                    onError={(e) => {
                      e.currentTarget.src = "/logo.svg";
                    }}
                  />
                </div>
                <p className="text-gray-400 text-center md:text-left flex-1 mx-4">
                  {t("footer.tagline")}
                </p>
                <a
                  href="https://app.menodao.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
                >
                  {t("footer.launchApp")}
                </a>
              </div>

              {/* Social Icons */}
              <div className="flex items-center justify-center md:justify-start space-x-6 mb-8 md:mb-12">
                <a
                  href="https://wa.me/254743178950"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5 text-white" />
                </a>
                <a
                  href="https://tiktok.com/@yourfavdrpapi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
                  aria-label="TikTok"
                >
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/menodao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-white" />
                </a>
              </div>

              {/* Company Info & Copyright */}
              <div className="border-t border-gray-800 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Registration Info */}
                  <div className="text-center md:text-left">
                    <h4 className="text-white font-semibold mb-2">
                      {t("footer.registeredCooperative")}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Reg. No: {companyInfo.registrationNumber}
                    </p>
                  </div>

                  {/* Physical Address */}
                  <div className="text-center md:text-left">
                    <h4 className="text-white font-semibold mb-2 flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("footer.officeLocation")}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {companyInfo.physicalAddress}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="text-center md:text-left">
                    <h4 className="text-white font-semibold mb-2">
                      {t("footer.contactUs")}
                    </h4>
                    <p className="text-sm text-gray-400">{companyInfo.email}</p>
                    <p className="text-sm text-gray-400">{companyInfo.phone}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                  <Link
                    href="/compliance"
                    className="text-sm text-gray-400 hover:text-white underline underline-offset-4"
                  >
                    {t("footer.compliance")}
                  </Link>
                  <LanguageSwitcher className="border-gray-600 text-gray-300" />
                </div>
                <p className="text-sm md:text-base text-gray-400 text-center">
                  {t("footer.copyright")}
                </p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </I18nextProvider>
  );
}
