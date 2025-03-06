import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  );
};

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export const FormLabel: React.FC<FormLabelProps> = ({ 
  children, 
  className = '', 
  required = false,
  ...props 
}) => {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  className = '', 
  error,
  ...props 
}) => {
  const errorClasses = error ? 
    'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 
    'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  
  return (
    <>
      <input 
        className={`w-full p-2 border ${errorClasses} rounded-md shadow-sm ${className}`}
        {...props} 
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ 
  className = '', 
  error,
  ...props 
}) => {
  const errorClasses = error ? 
    'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 
    'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  
  return (
    <>
      <textarea 
        className={`w-full p-2 border ${errorClasses} rounded-md shadow-sm ${className}`}
        {...props} 
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: Array<{ value: string, label: string }>;
}

export const FormSelect: React.FC<FormSelectProps> = ({ 
  className = '', 
  error,
  options,
  ...props 
}) => {
  const errorClasses = error ? 
    'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : 
    'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  
  return (
    <>
      <select 
        className={`w-full p-2 border ${errorClasses} rounded-md shadow-sm ${className}`}
        {...props} 
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </>
  );
};

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({ 
  className = '', 
  label,
  error,
  ...props 
}) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          className={`h-4 w-4 text-blue-600 border-gray-300 rounded ${className}`}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label className="font-medium text-gray-700">{label}</label>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export const FormError = ({ children }: { children: React.ReactNode }) => {
  if (!children) {
    return null;
  }
  
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{children}</p>
        </div>
      </div>
    </div>
  );
};

export const FormSuccess = ({ children }: { children: React.ReactNode }) => {
  if (!children) {
    return null;
  }
  
  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-700">{children}</p>
        </div>
      </div>
    </div>
  );
};
