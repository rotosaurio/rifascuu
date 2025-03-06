import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'flat';
  clickable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 className={`text-lg md:text-xl font-bold text-gray-800 ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 pt-0 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardDivider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <div className={`border-t border-gray-200 my-0 ${className}`} {...props}></div>
  );
};
