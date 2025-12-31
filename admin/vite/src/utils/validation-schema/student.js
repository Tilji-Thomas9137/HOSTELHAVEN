export const nameSchema = {
  required: 'Name is required',
  minLength: { value: 2, message: 'Name must be at least 2 characters' },
  maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
  pattern: { value: /^[a-zA-Z\s.'-]+$/, message: 'Name can only contain letters, spaces, dots, apostrophes, and hyphens' },
  validate: {
    trim: (value) => {
      const trimmedValue = value.trim();
      return trimmedValue.length >= 2 || 'Name must be at least 2 characters';
    },
    notOnlySpaces: (value) => {
      return value.trim().length >= 2 || 'Name cannot be empty or contain only spaces';
    }
  },
  onBlur: (e) => {
    e.target.value = e.target.value.trim();
  }
};

export const emailSchema = {
  required: 'Email is required',
  minLength: { value: 5, message: 'Email must be at least 5 characters' },
  maxLength: { value: 255, message: 'Email cannot exceed 255 characters' },
  validate: {
    trim: (value) => {
      if (!value) return 'Email is required';
      const trimmedValue = value.toString().trim();
      return trimmedValue.length >= 5 || 'Email must be at least 5 characters';
    },
    notEmpty: (value) => {
      if (!value) return 'Email is required';
      return value.toString().trim().length > 0 || 'Email cannot be empty';
    },
    validFormat: (value) => {
      if (!value) return 'Email is required';
      const trimmed = value.toString().trim().toLowerCase();
      
      // Strict email validation - only valid formats allowed
      // Step 1: Basic structure check - must have @ and .
      if (!trimmed.includes('@') || !trimmed.includes('.')) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
      
      // Step 2: Check that @ appears only once
      const atCount = (trimmed.match(/@/g) || []).length;
      if (atCount !== 1) {
        return 'Email must contain exactly one @ symbol';
      }
      
      // Step 3: Split into local and domain parts
      const parts = trimmed.split('@');
      const localPart = parts[0];
      const domainPart = parts[1];
      
      // Step 4: Validate local part (before @)
      if (!localPart || localPart.length === 0) {
        return 'Email must have a local part before @';
      }
      if (localPart.length > 64) {
        return 'Email local part cannot exceed 64 characters';
      }
      // Local part cannot start or end with dot, dash, or underscore
      if (/^[._-]|[._-]$/.test(localPart)) {
        return 'Email local part cannot start or end with dot, dash, or underscore';
      }
      // Check for consecutive dots
      if (localPart.includes('..')) {
        return 'Email cannot contain consecutive dots';
      }
      // Local part can only contain: letters, numbers, dots, hyphens, underscores, plus signs
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?$/.test(localPart)) {
        return 'Email local part contains invalid characters';
      }
      
      // Step 5: Validate domain part (after @)
      if (!domainPart || domainPart.length === 0) {
        return 'Email must have a domain part after @';
      }
      if (domainPart.length > 253) {
        return 'Email domain cannot exceed 253 characters';
      }
      // Domain cannot start or end with dot or dash
      if (/^[.-]|[.-]$/.test(domainPart)) {
        return 'Email domain cannot start or end with dot or dash';
      }
      // Check for consecutive dots in domain
      if (domainPart.includes('..')) {
        return 'Email domain cannot contain consecutive dots';
      }
      // Domain must have at least one dot (for TLD)
      const domainParts = domainPart.split('.');
      if (domainParts.length < 2) {
        return 'Email must have a valid domain with extension (e.g., example.com)';
      }
      
      // Step 6: Validate each domain segment
      for (let i = 0; i < domainParts.length; i++) {
        const segment = domainParts[i];
        // Each segment must not be empty
        if (!segment || segment.length === 0) {
          return 'Email domain cannot have empty segments';
        }
        // Each segment cannot start or end with dash
        if (/^-|-$/.test(segment)) {
          return 'Email domain segments cannot start or end with dash';
        }
        // Each segment can only contain letters, numbers, and hyphens
        if (!/^[a-zA-Z0-9-]+$/.test(segment)) {
          return 'Email domain segments can only contain letters, numbers, and hyphens';
        }
        // Each segment cannot exceed 63 characters
        if (segment.length > 63) {
          return 'Email domain segments cannot exceed 63 characters';
        }
      }
      
      // Step 7: Validate TLD (last segment) - must be letters only, at least 2 characters
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2) {
        return 'Email must have a valid domain extension with at least 2 letters (e.g., .com, .org)';
      }
      if (!/^[a-zA-Z]+$/.test(tld)) {
        return 'Email domain extension must contain only letters (e.g., .com, .org, .edu)';
      }
      // TLD cannot contain numbers or special characters
      if (/[0-9]/.test(tld)) {
        return 'Email domain extension cannot contain numbers (e.g., .com is valid, .123 is not)';
      }
      
      // Step 8: Final comprehensive pattern check
      const strictEmailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!strictEmailPattern.test(trimmed)) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
      
      return true;
    }
  },
  onBlur: (e) => {
    if (e.target.value) {
      e.target.value = e.target.value.trim().toLowerCase();
    }
  }
};

export const phoneSchema = {
  required: 'Phone number is required',
  pattern: { value: /^[0-9]{10,15}$/, message: 'Phone number must be 10-15 digits' }
};

export const courseSchema = {
  required: 'Course is required',
  validate: {
    notEmpty: (value) => value !== '' || 'Please select a course'
  }
};

export const yearSchema = {
  required: 'Year is required',
  validate: {
    notEmpty: (value) => value !== '' || 'Please select a year'
  }
};

export const dateOfBirthSchema = {
  validate: {
    notFuture: (value) => {
      if (!value) return true; // Optional
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate <= today || 'Date of birth cannot be in the future';
    },
    validAge: (value) => {
      if (!value) return true; // Optional
      const selectedDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 15) return 'Student must be at least 15 years old';
      if (actualAge > 100) return 'Please enter a valid date of birth';
      return true;
    }
  }
};

export const addressSchema = {
  maxLength: { value: 500, message: 'Address cannot exceed 500 characters' },
  validate: {
    trim: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      return trimmed.length >= 5 || 'Address must be at least 5 characters if provided';
    },
    validLength: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      if (trimmed.length > 500) return 'Address cannot exceed 500 characters';
      return true;
    }
  }
};

export const admissionNumberSchema = {
  required: 'Admission number is required',
  minLength: { value: 3, message: 'Admission number must be at least 3 characters' },
  maxLength: { value: 20, message: 'Admission number cannot exceed 20 characters' },
  pattern: {
    value: /^[A-Z0-9]+$/,
    message: 'Admission number should contain only uppercase letters and numbers'
  },
  validate: {
    trim: (value) => {
      const trimmedValue = value.trim();
      return trimmedValue.length >= 3 || 'Admission number must be at least 3 characters';
    },
    uppercase: (value) => {
      return value === value.toUpperCase() || 'Admission number must be in uppercase';
    },
    notOnlyNumbers: (value) => {
      // Optional: You can make admission number require at least one letter
      // return /[A-Z]/.test(value) || 'Admission number must contain at least one letter';
      return true;
    }
  },
  onBlur: (e) => {
    e.target.value = e.target.value.trim().toUpperCase();
  }
};

export const emergencyContactNameSchema = {
  maxLength: { value: 100, message: 'Contact name cannot exceed 100 characters' },
  validate: {
    trim: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      return trimmed.length >= 2 || 'Contact name must be at least 2 characters if provided';
    },
    validFormat: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const namePattern = /^[a-zA-Z\s.'-]+$/;
      return namePattern.test(value.toString().trim()) || 'Contact name can only contain letters, spaces, dots, apostrophes, and hyphens';
    },
    notOnlySpaces: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      return trimmed.length >= 2 || 'Contact name cannot be only spaces';
    }
  }
};

export const emergencyContactPhoneSchema = {
  validate: {
    required: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      return trimmed.length >= 10 || 'Contact phone must be at least 10 digits';
    },
    format: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      return /^[0-9]+$/.test(trimmed) || 'Contact phone must contain only digits';
    },
    length: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim();
      if (trimmed.length < 10) return 'Contact phone must be at least 10 digits';
      if (trimmed.length > 15) return 'Contact phone cannot exceed 15 digits';
      return true;
    }
  }
};

export const parentEmailSchema = {
  validate: {
    format: (value) => {
      if (!value || value.toString().trim().length === 0) return true; // Optional
      const trimmed = value.toString().trim().toLowerCase();
      
      // Strict email validation - only valid formats allowed
      // Step 1: Basic structure check - must have @ and .
      if (!trimmed.includes('@') || !trimmed.includes('.')) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
      
      // Step 2: Check that @ appears only once
      const atCount = (trimmed.match(/@/g) || []).length;
      if (atCount !== 1) {
        return 'Email must contain exactly one @ symbol';
      }
      
      // Step 3: Split into local and domain parts
      const parts = trimmed.split('@');
      const localPart = parts[0];
      const domainPart = parts[1];
      
      // Step 4: Validate local part (before @)
      if (!localPart || localPart.length === 0) {
        return 'Email must have a local part before @';
      }
      if (localPart.length > 64) {
        return 'Email local part cannot exceed 64 characters';
      }
      if (/^[._-]|[._-]$/.test(localPart)) {
        return 'Email local part cannot start or end with dot, dash, or underscore';
      }
      if (localPart.includes('..')) {
        return 'Email cannot contain consecutive dots';
      }
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?$/.test(localPart)) {
        return 'Email local part contains invalid characters';
      }
      
      // Step 5: Validate domain part (after @)
      if (!domainPart || domainPart.length === 0) {
        return 'Email must have a domain part after @';
      }
      if (domainPart.length > 253) {
        return 'Email domain cannot exceed 253 characters';
      }
      if (/^[.-]|[.-]$/.test(domainPart)) {
        return 'Email domain cannot start or end with dot or dash';
      }
      if (domainPart.includes('..')) {
        return 'Email domain cannot contain consecutive dots';
      }
      const domainParts = domainPart.split('.');
      if (domainParts.length < 2) {
        return 'Email must have a valid domain with extension (e.g., example.com)';
      }
      
      // Step 6: Validate each domain segment
      for (let i = 0; i < domainParts.length; i++) {
        const segment = domainParts[i];
        if (!segment || segment.length === 0) {
          return 'Email domain cannot have empty segments';
        }
        if (/^-|-$/.test(segment)) {
          return 'Email domain segments cannot start or end with dash';
        }
        if (!/^[a-zA-Z0-9-]+$/.test(segment)) {
          return 'Email domain segments can only contain letters, numbers, and hyphens';
        }
        if (segment.length > 63) {
          return 'Email domain segments cannot exceed 63 characters';
        }
      }
      
      // Step 7: Validate TLD (last segment) - must be letters only
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2) {
        return 'Email must have a valid domain extension with at least 2 letters (e.g., .com, .org)';
      }
      if (!/^[a-zA-Z]+$/.test(tld)) {
        return 'Email domain extension must contain only letters (e.g., .com, .org, .edu)';
      }
      if (/[0-9]/.test(tld)) {
        return 'Email domain extension cannot contain numbers (e.g., .com is valid, .123 is not)';
      }
      
      // Step 8: Final comprehensive pattern check
      const strictEmailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!strictEmailPattern.test(trimmed)) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
      
      return true;
    },
    trim: (value) => {
      if (!value) return true;
      return value.toString().trim().length > 0 || 'Email cannot be empty';
    }
  },
  onBlur: (e) => {
    if (e.target.value) {
      e.target.value = e.target.value.trim().toLowerCase();
    }
  }
};
