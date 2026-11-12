
const serviceDetailsData = {
  'nid-0': {
    estimatedCost: 'Free',
    processingTime: 'Depends on verification',
    relevantOffice: 'Upazila / Thana Election Office',

    requiredDocuments: [
      'Online Birth Registration Certificate',
      'SSC or equivalent certificate (if applicable)',
      'Proof of residential address (Utility Bill)',
      'Citizenship Certificate (if required)',
      'Father and Mother NID photocopies',
      'Spouse NID photocopy (if married)',
      'Passport, Driving Licence or TIN (if available)',
    ],

    applicationSteps: {
      online: [
        'Visit the official NID Application Portal.',
        'Select the new voter registration option.',
        'Fill out the online application form with accurate information.',
        'Submit the application and download or print the application form.',
        'Follow the portal instructions for further verification.',
      ],

      offline: [
        'Visit your nearest Upazila or Thana Election Office.',
        'Take the printed application form with the required supporting documents.',
        'Submit the application and supporting documents to the election office.',
        'The election office will verify your submitted information and documents.',
        'Attend photograph and biometric data collection as instructed.',
        'Wait for the registration process to be completed.',
        'Collect or download your NID after approval.',
      ],
    },

    officialLink: 'https://services.nidw.gov.bd/nid-pub/',

    officeInformation:
      'Contact your local Upazila or Thana Election Office for application verification and biometric enrollment.',

    overview:
      'New NID Registration allows eligible Bangladeshi citizens who are not yet registered to apply for voter registration and obtain a National Identity Card.',
  },

  'nid-1': {
    estimatedCost: 'Depends on reissue type',
    processingTime: 'Depends on application approval',
    relevantOffice: 'Upazila / Thana Election Office',

    requiredDocuments: [
      'Existing NID number or account information',
      'Required identity information',
      'Supporting documents, if requested',
      'Payment information for applicable reissue fee',
      'Additional documents as instructed by the Election Office',
    ],

    applicationSteps: {
      online: [
        'Visit the official Bangladesh NID portal.',
        'Register or log in to your NID account.',
        'Select the Reissue option for a lost or damaged NID.',
        'Provide the required application information.',
        'Pay the applicable reissue fee.',
        'Submit the application.',
        'Wait for approval notification through SMS or email.',
        'Download your NID copy from the online portal after approval.',
      ],

      offline: [
        'Visit your nearest Upazila or Thana Election Office.',
        'Inform the responsible officer that your NID card is lost or damaged.',
        'Provide your NID number or other identity information.',
        'Submit the required supporting documents.',
        'Complete the reissue application process as instructed by the office.',
        'Pay the applicable reissue fee using the approved payment method.',
        'Keep the application receipt or reference information.',
        'Collect or download your reissued NID after approval.',
      ],
    },

    officialLink: 'https://services.nidw.gov.bd/nid-pub/',

    officeInformation:
      'Contact your relevant Upazila or Thana Election Office if you need assistance with your reissue application.',

    overview:
      'Lost NID Reissue allows registered Bangladeshi citizens to apply for a replacement National Identity Card when their existing card is lost or damaged.',
  },

  'nid-2': {
    estimatedCost: 'Depends on correction type',
    processingTime: 'Depends on document verification',
    relevantOffice: 'Upazila / Thana / District Election Office',

    requiredDocuments: [
      'Existing National ID Card',
      'SSC or equivalent certificate (if applicable)',
      'Birth Registration Certificate (if applicable)',
      'Passport or Driving Licence (if applicable)',
      'Supporting documents for the requested correction',
      'Additional documents as required by the Election Commission',
    ],

    applicationSteps: {
      online: [
        'Visit the official Bangladesh NID portal.',
        'Register or log in to your NID account.',
        'Select the NID Information Correction option.',
        'Choose the information you want to correct.',
        'Enter the correct information carefully.',
        'Upload the required supporting documents.',
        'Pay the applicable correction fee.',
        'Submit the application and wait for verification.',
        'Attend an election office hearing if required.',
        'Check the application result through the NID portal.',
      ],

      offline: [
        'Visit your nearest Upazila, Thana or District Election Office.',
        'Explain which information on your NID needs correction.',
        'Collect or prepare the required correction application form as instructed.',
        'Attach supporting documents that prove the correct information.',
        'Submit the application and documents to the responsible officer.',
        'Pay the applicable correction fee using the approved payment method.',
        'Attend a hearing or provide additional documents if requested.',
        'Wait for document verification and the correction decision.',
        'Collect or download the corrected NID after approval.',
      ],
    },

    officialLink: 'https://services.nidw.gov.bd/nid-pub/',

    officeInformation:
      'Contact your relevant Upazila, Thana or District Election Office if additional documents or a hearing are required.',

    overview:
      'NID Information Correction allows registered voters to correct incorrect personal information on their National Identity Card by submitting appropriate supporting documents.',
  },

'nid-3': {
  estimatedCost: 'Depends on correction type',
  processingTime: 'Depends on document verification and investigation',
  relevantOffice: 'Upazila / Thana / District Election Office',

  requiredDocuments: [
    'Existing National ID Card',
    'Attested photocopy of SSC or equivalent certificate (if available)',
    'Birth Registration Certificate',
    'Passport or Driving Licence (if available)',
    'Other supporting documents proving the correct date of birth',
    'Additional documents as requested by the Election Commission',
  ],

  applicationSteps: {
    online: [
      'Visit the official Bangladesh NID portal.',
      'Register or log in to your NID account.',
      'Select the NID Information Correction option.',
      'Choose Date of Birth correction.',
      'Enter your correct date of birth carefully.',
      'Upload the required supporting documents.',
      'Pay the applicable correction fee.',
      'Review and submit your application.',
      'Wait for document verification and the application decision.',
      'Attend an investigation or medical examination if required.',
      'Check the application result through the NID portal.',
    ],

    offline: [
      'Visit your nearest Upazila, Thana or District Election Office.',
      'Explain that you need to correct your date of birth on your NID.',
      'Prepare the required supporting documents.',
      'If you have an SSC or equivalent certificate, provide its attested photocopy.',
      'If you do not have an SSC certificate, provide other available documents proving your correct age.',
      'Submit your application and supporting documents as instructed by the election office.',
      'Pay the applicable correction fee using the approved payment method.',
      'Cooperate with any investigation or medical examination if required.',
      'Wait for the verification and correction decision.',
      'Collect or download your corrected NID after approval.',
    ],
  },

  officialLink: 'https://services.nidw.gov.bd/nid-pub/',

  officeInformation:
    'Contact your nearest Upazila, Thana or District Election Office for assistance with date of birth correction, document verification and investigation.',

  overview:
    'Date of Birth Correction allows registered NID holders to correct an incorrect date of birth by providing valid supporting documents and completing the required verification process.',
},

'nid-4': {
  estimatedCost: 'Depends on correction or voter area transfer type',
  processingTime: 'Depends on document verification',
  relevantOffice: 'Upazila / Thana Election Office',

  requiredDocuments: [
    'Existing National ID Card photocopy',
    'Family member NID photocopy, if applicable',
    'Electricity, gas, water or telephone bill as address proof',
    'House ownership document or land document, if applicable',
    'House rent agreement or rent receipt, if applicable',
    'Holding tax payment receipt, if applicable',
    'Citizenship Certificate or Ward Commissioner / Chairman certificate, if required',
    'Additional supporting documents as requested by the Election Office',
  ],

  applicationSteps: {
    online: [
      'Visit the official Bangladesh NID portal.',
      'Register or log in to your NID account.',
      'Select the Address or Voter Area Change option, as applicable.',
      'Enter your correct present and permanent address information.',
      'Upload the required supporting documents.',
      'Review all information carefully.',
      'Pay the applicable fee, if required.',
      'Submit the application if the requested change is available online.',
      'Follow the portal instructions for verification.',
      'Check the application result through the NID portal.',
    ],

    offline: [
      'Visit the Upazila or Thana Election Office relevant to your current area.',
      'Explain whether you need to correct your address or transfer your voter area.',
      'For voter area transfer due to relocation, collect or prepare Form-13 as instructed.',
      'For an address correction within the same voter area, apply using the correction process as instructed by the office.',
      'Attach your NID photocopy and supporting address documents.',
      'Submit the application to the responsible election officer.',
      'Provide additional documents or information if requested.',
      'Allow the election office to verify your new address.',
      'Wait for the application decision and follow the office instructions.',
      'Check or collect your updated NID information after approval.',
    ],
  },

  officialLink: 'https://services.nidw.gov.bd/nid-pub/',

  officeInformation:
    'For voter area transfer, contact the Upazila or Thana Election Office in the area where you currently live. For ordinary address corrections, contact the relevant Election Office for document requirements.',

  overview:
    'Address Change allows NID holders to correct their address information or transfer their voter area after changing residence. The application process depends on whether the change is within the same voter area or involves moving to a different voter area.',
},


};

export default serviceDetailsData;
