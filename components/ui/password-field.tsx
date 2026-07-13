"use client";

import { useState } from "react";

export function PasswordField({
  autoComplete,
  label = "Password",
  minLength,
  name = "password",
  required = true
}: {
  autoComplete?: string;
  label?: string;
  minLength?: number;
  name?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-field">
        <input
          autoComplete={autoComplete}
          minLength={minLength}
          name={name}
          required={required}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
            {visible ? (
              <>
                <path d="M3 3.9 4.3 2.6l17.1 17.1-1.3 1.3-3.2-3.2A10.8 10.8 0 0 1 12 19c-5.3 0-9-4.7-10.2-6.7a1.5 1.5 0 0 1 0-1.6A20 20 0 0 1 6.3 5.9L3 3.9Z" />
                <path d="M12 5c5.3 0 9 4.7 10.2 6.7.3.5.3 1.1 0 1.6a18.7 18.7 0 0 1-2.1 2.8l-2.4-2.4A6 6 0 0 0 10.3 6L8.6 4.3A11.5 11.5 0 0 1 12 5Z" />
              </>
            ) : (
              <>
                <path d="M12 5c5.3 0 9 4.7 10.2 6.7.3.5.3 1.1 0 1.6C21 15.3 17.3 20 12 20S3 15.3 1.8 13.3a1.5 1.5 0 0 1 0-1.6C3 9.7 6.7 5 12 5Zm0 2C7.8 7 4.7 10.6 3.6 12.5 4.7 14.4 7.8 18 12 18s7.3-3.6 8.4-5.5C19.3 10.6 16.2 7 12 7Z" />
                <path d="M12 9a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
              </>
            )}
          </svg>
        </button>
      </span>
    </label>
  );
}
