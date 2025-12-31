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

export const passwordSchema = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  validate: {
    noSpaces: (value) => !/\s/.test(value) || 'Password cannot contain spaces',
    hasUpperCase: (value) => /[A-Z]/.test(value) || 'Password must have at least one uppercase letter',
    hasNumber: (value) => /[0-9]/.test(value) || 'Password must have at least one number',
    hasSpecialChar: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must have at least one special character'
  }
};

export const firstNameSchema = {
  required: 'First name is required',
  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Invalid first name' },
  validate: {
    trim: (value) => {
      const trimmedValue = value.trim();
      return trimmedValue.length > 0 || 'First name cannot be empty or contain only spaces';
    }
  },
  onBlur: (e) => {
    e.target.value = e.target.value.trim();
  }
};

export const lastNameSchema = {
  required: 'Last name is required',
  pattern: { value: /^[a-zA-Z\s]+$/, message: 'Invalid last name' },
  validate: {
    trim: (value) => {
      const trimmedValue = value.trim();
      return trimmedValue.length > 0 || 'Last name cannot be empty or contain only spaces';
    }
  },
  onBlur: (e) => {
    e.target.value = e.target.value.trim();
  }
};

export const usernameSchema = {
  required: 'Username is required',
  pattern: {
    value: /^[a-zA-Z0-9._]+$/, // Alphanumeric, underscores, and dots
    message: 'Username can only contain letters, numbers, dots, and underscores'
  },
  validate: {
    trim: (value) => {
      const trimmedValue = value.trim();
      return trimmedValue.length > 0 || 'Username cannot be empty or contain only spaces';
    },
    noSpaces: (value) => {
      return !/\s/.test(value) || 'Username cannot contain spaces';
    }
  },
  onBlur: (e) => {
    e.target.value = e.target.value.trim();
  }
};

export const contactSchema = {
  required: 'Phone number is required',
  minLength: { value: 10, message: 'Phone number must be at least 10 digits' },
  maxLength: { value: 15, message: 'Phone number cannot exceed 15 digits' },
  pattern: { 
    value: /^[0-9]+$/, 
    message: 'Phone number must contain only digits' 
  },
  validate: {
    notEmpty: (value) => {
      const trimmed = value ? value.toString().trim() : '';
      return trimmed.length >= 10 || 'Phone number must be at least 10 digits';
    },
    onlyDigits: (value) => {
      if (!value) return 'Phone number is required';
      return /^[0-9]+$/.test(value.toString().trim()) || 'Phone number must contain only digits';
    }
  }
};

export const otpSchema = {
  required: 'OTP is required',
  minLength: { value: 6, message: 'OTP must be exactly 6 characters' }
};
