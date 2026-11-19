/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  translations,
  categoryTranslationsBn,
  serviceTranslationsBn,
  serverMessagesBn,
} from '../i18n/translations';
import serviceDetailsData from '../data/serviceDetailsData';
import serviceDetailsDataBn from '../data/serviceDetailsDataBn';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('govservice_language');
    return saved === 'bn' ? 'bn' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('govservice_language', language);
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  }, [language]);

  const t = useCallback(
    (key) => {
      const dict = translations[language] || translations.en;
      return dict[key] ?? translations.en[key] ?? key;
    },
    [language]
  );

  const categoryTitle = useCallback(
    (categoryId, fallbackTitle) => {
      if (language === 'bn' && categoryTranslationsBn[categoryId]) {
        return categoryTranslationsBn[categoryId];
      }
      return fallbackTitle;
    },
    [language]
  );

  const serviceName = useCallback(
    (name) => {
      if (language === 'bn' && serviceTranslationsBn[name]) {
        return serviceTranslationsBn[name];
      }
      return name;
    },
    [language]
  );

  const getServiceDetails = useCallback(
    (serviceKey, rawDetails) => {
      if (!rawDetails && !serviceDetailsData[serviceKey]) return null;
      const base = rawDetails || serviceDetailsData[serviceKey] || {};
      if (language !== 'bn') return base;

      const enStatic = serviceDetailsData[serviceKey];
      const bnStatic = serviceDetailsDataBn[serviceKey];
      if (!bnStatic) {
        return {
          ...base,
          estimatedCost:
            base.estimatedCost === 'To be verified'
              ? t('toBeVerified')
              : base.estimatedCost,
          processingTime:
            base.processingTime === 'To be verified'
              ? t('toBeVerified')
              : base.processingTime,
        };
      }

      const pickField = (field) => {
        const currentVal = base[field];
        if (!currentVal) return bnStatic[field] ?? currentVal;
        if (!enStatic || JSON.stringify(currentVal) === JSON.stringify(enStatic[field])) {
          return bnStatic[field] ?? currentVal;
        }
        return currentVal;
      };

      const rawCost = pickField('estimatedCost');
      const rawTime = pickField('processingTime');

      return {
        ...base,
        overview: pickField('overview'),
        estimatedCost: rawCost === 'To be verified' ? t('toBeVerified') : rawCost,
        processingTime: rawTime === 'To be verified' ? t('toBeVerified') : rawTime,
        relevantOffice: pickField('relevantOffice'),
        requiredDocuments: pickField('requiredDocuments'),
        applicationSteps: pickField('applicationSteps'),
        officeInformation: pickField('officeInformation'),
      };
    },
    [language, t]
  );

  const translateMessage = useCallback(
    (msg, fallbackKey) => {
      if (!msg) return fallbackKey ? t(fallbackKey) : '';
      if (language === 'bn') {
        if (serverMessagesBn[msg]) return serverMessagesBn[msg];
        if (fallbackKey && /^Failed to |^Server error|^Could not /i.test(msg)) {
          return t(fallbackKey);
        }
      }
      return msg;
    },
    [language, t]
  );

  const feedbackTypeLabel = useCallback(
    (type) => {
      const map = {
        Suggestion: t('feedbackTypeSuggestion'),
        'Bug Report': t('feedbackTypeBug'),
        'Service Info Correction': t('feedbackTypeCorrection'),
        'General Inquiry': t('feedbackTypeInquiry'),
      };
      return map[type] || type;
    },
    [t]
  );

  const feedbackStatusLabel = useCallback(
    (status) => {
      const normalized = (status || 'pending').toLowerCase();
      if (normalized === 'reviewed') return t('statusReviewed');
      if (normalized === 'resolved') return t('statusResolved');
      return t('statusPending');
    },
    [t]
  );

  const overviewCardDesc = useCallback(
    (menuKey) => {
      const map = {
        'Personal Information': t('overviewCardPersonalDesc'),
        'Saved Services': t('overviewCardSavedDesc'),
        'My Document Checklist': t('overviewCardChecklistDesc'),
        'My Downloads': t('overviewCardDownloadsDesc'),
        'Feedback & Reports': t('overviewCardFeedbackDesc'),
        'Account Settings': t('overviewCardSettingsDesc'),
      };
      return map[menuKey] || '';
    },
    [t]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        categoryTitle,
        serviceName,
        getServiceDetails,
        translateMessage,
        feedbackTypeLabel,
        feedbackStatusLabel,
        overviewCardDesc,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
