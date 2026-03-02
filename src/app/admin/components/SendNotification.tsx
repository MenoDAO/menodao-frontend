"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Bell,
  Send,
  AlertCircle,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface RecipientFilters {
  packageTypes: string[];
  dateJoinedFrom: string;
  dateJoinedTo: string;
  balanceMin: string;
  balanceMax: string;
  subscriptionStatus: "active" | "inactive" | "all";
  singlePhoneNumber: string;
  csvFile: File | null;
}

export function SendNotification() {
  const [notificationType, setNotificationType] = useState<"SMS" | "PUSH">(
    "SMS",
  );
  const [message, setMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [filters, setFilters] = useState<RecipientFilters>({
    packageTypes: [],
    dateJoinedFrom: "",
    dateJoinedTo: "",
    balanceMin: "",
    balanceMax: "",
    subscriptionStatus: "all",
    singlePhoneNumber: "",
    csvFile: null,
  });
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [csvError, setCsvError] = useState<string>("");
  const [csvValidPhoneCount, setCsvValidPhoneCount] = useState<number>(0);
  const [csvPhoneNumbers, setCsvPhoneNumbers] = useState<string[]>([]);
  const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string>("");
  const [sendSuccess, setSendSuccess] = useState<{
    notificationId: string;
    recipientCount: number;
  } | null>(null);

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for international phone numbers
    // Accepts formats like: +254712345678, 254712345678, 0712345678
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Normalize phone number to consistent format (+254...)
  const normalizePhoneNumber = (phone: string): string => {
    let normalized = phone.replace(/\s/g, "");

    if (normalized.startsWith("0")) {
      normalized = "+254" + normalized.substring(1);
    } else if (normalized.startsWith("254")) {
      normalized = "+" + normalized;
    } else if (!normalized.startsWith("+")) {
      normalized = "+254" + normalized;
    }

    return normalized;
  };

  // Parse CSV file and extract valid phone numbers
  const parseCSV = (content: string): { valid: string[]; errors: string[] } => {
    const valid: string[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();

    const lines = content.split(/\r?\n/);

    // Skip header row if it looks like a header
    const startIndex =
      lines[0] &&
      (lines[0].toLowerCase().includes("phone") ||
        lines[0].toLowerCase().includes("number"))
        ? 1
        : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      // Extract first column (split by comma, semicolon, or tab)
      const columns = line.split(/[,;\t]/);
      const phoneNumber = columns[0].trim();

      if (!phoneNumber) continue;

      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        errors.push(`Line ${i + 1}: Invalid phone number "${phoneNumber}"`);
        continue;
      }

      // Normalize phone number format
      const normalized = normalizePhoneNumber(phoneNumber);

      // Deduplicate
      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      valid.push(normalized);
    }

    return { valid, errors };
  };

  // Debounced preview function
  const fetchRecipientPreview = useCallback(
    async (currentFilters: RecipientFilters, csvPhones: string[]) => {
      try {
        setIsLoadingPreview(true);

        // Build filters object for API call
        const apiFilters: Record<string, string | string[]> = {};

        if (currentFilters.packageTypes.length > 0) {
          apiFilters.packageTypes = currentFilters.packageTypes;
        }
        if (currentFilters.dateJoinedFrom) {
          apiFilters.dateJoinedFrom = currentFilters.dateJoinedFrom;
        }
        if (currentFilters.dateJoinedTo) {
          apiFilters.dateJoinedTo = currentFilters.dateJoinedTo;
        }
        if (currentFilters.balanceMin) {
          apiFilters.balanceMin = currentFilters.balanceMin;
        }
        if (currentFilters.balanceMax) {
          apiFilters.balanceMax = currentFilters.balanceMax;
        }
        if (currentFilters.subscriptionStatus !== "all") {
          apiFilters.subscriptionStatus = currentFilters.subscriptionStatus;
        }
        if (currentFilters.singlePhoneNumber) {
          apiFilters.singlePhoneNumber = currentFilters.singlePhoneNumber;
        }
        if (csvPhones.length > 0) {
          apiFilters.csvPhoneNumbers = csvPhones;
        }

        const result = await adminApi.previewRecipients(apiFilters);
        setRecipientCount(result.count);
      } catch (error) {
        console.error("Failed to fetch recipient preview:", error);
        setRecipientCount(0);
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [],
  );

  // Debounce the preview API call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecipientPreview(filters, csvPhoneNumbers);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, csvPhoneNumbers, fetchRecipientPreview]);

  const handlePackageTypeChange = (packageType: string) => {
    setFilters((prev) => {
      const newPackageTypes = prev.packageTypes.includes(packageType)
        ? prev.packageTypes.filter((p) => p !== packageType)
        : [...prev.packageTypes, packageType];
      return { ...prev, packageTypes: newPackageTypes };
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".csv")) {
        setCsvError("File must be in CSV format");
        setCsvFileName("");
        setCsvValidPhoneCount(0);
        setCsvPhoneNumbers([]);
        setCsvValidationErrors([]);
        setFilters((prev) => ({ ...prev, csvFile: null }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCsvError("CSV file exceeds maximum size of 5MB");
        setCsvFileName("");
        setCsvValidPhoneCount(0);
        setCsvPhoneNumbers([]);
        setCsvValidationErrors([]);
        setFilters((prev) => ({ ...prev, csvFile: null }));
        return;
      }

      // Read and parse CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content || content.trim() === "") {
            setCsvError("CSV file is empty");
            setCsvFileName("");
            setCsvValidPhoneCount(0);
            setCsvPhoneNumbers([]);
            setCsvValidationErrors([]);
            setFilters((prev) => ({ ...prev, csvFile: null }));
            return;
          }

          const { valid, errors } = parseCSV(content);

          if (valid.length === 0) {
            setCsvError("No valid phone numbers found in CSV");
            setCsvFileName(file.name);
            setCsvValidPhoneCount(0);
            setCsvPhoneNumbers([]);
            setCsvValidationErrors(errors);
            setFilters((prev) => ({ ...prev, csvFile: file }));
            return;
          }

          // Success - valid phone numbers found
          setCsvError("");
          setCsvFileName(file.name);
          setCsvValidPhoneCount(valid.length);
          setCsvPhoneNumbers(valid);
          setCsvValidationErrors(errors);
          setFilters((prev) => ({ ...prev, csvFile: file }));
        } catch {
          setCsvError("Failed to parse CSV file");
          setCsvFileName("");
          setCsvValidPhoneCount(0);
          setCsvPhoneNumbers([]);
          setCsvValidationErrors([]);
          setFilters((prev) => ({ ...prev, csvFile: null }));
        }
      };

      reader.onerror = () => {
        setCsvError("Failed to read CSV file");
        setCsvFileName("");
        setCsvValidPhoneCount(0);
        setCsvPhoneNumbers([]);
        setCsvValidationErrors([]);
        setFilters((prev) => ({ ...prev, csvFile: null }));
      };

      reader.readAsText(file);
    }
  };

  const handleSendClick = () => {
    // Validate form inputs
    if (!message.trim()) {
      setSendError("Message cannot be empty");
      return;
    }

    if (recipientCount === 0) {
      setSendError("No recipients match the specified filters");
      return;
    }

    // Validate message length for SMS
    if (notificationType === "SMS" && message.length > 1600) {
      setSendError("SMS message exceeds maximum length of 1600 characters");
      return;
    }

    // Validate single phone number if provided
    if (
      filters.singlePhoneNumber &&
      !validatePhoneNumber(filters.singlePhoneNumber)
    ) {
      setSendError(`Invalid phone number format: ${filters.singlePhoneNumber}`);
      return;
    }

    // Validate date range
    if (filters.dateJoinedFrom && filters.dateJoinedTo) {
      const fromDate = new Date(filters.dateJoinedFrom);
      const toDate = new Date(filters.dateJoinedTo);
      if (toDate < fromDate) {
        setSendError("End date must be after start date");
        return;
      }
    }

    // Validate balance range
    if (filters.balanceMin && filters.balanceMax) {
      const min = parseFloat(filters.balanceMin);
      const max = parseFloat(filters.balanceMax);
      if (min < 0 || max < 0) {
        setSendError("Balance values must be non-negative");
        return;
      }
      if (max < min) {
        setSendError("Maximum balance must be greater than minimum balance");
        return;
      }
    }

    // Clear any previous errors and show confirmation dialog
    setSendError("");
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    try {
      setIsSending(true);
      setSendError("");

      // Build filters object for API call
      const apiFilters: Record<string, string | string[]> = {};

      if (filters.packageTypes.length > 0) {
        apiFilters.packageTypes = filters.packageTypes;
      }
      if (filters.dateJoinedFrom) {
        apiFilters.dateJoinedFrom = filters.dateJoinedFrom;
      }
      if (filters.dateJoinedTo) {
        apiFilters.dateJoinedTo = filters.dateJoinedTo;
      }
      if (filters.balanceMin) {
        apiFilters.balanceMin = filters.balanceMin;
      }
      if (filters.balanceMax) {
        apiFilters.balanceMax = filters.balanceMax;
      }
      if (filters.subscriptionStatus !== "all") {
        apiFilters.subscriptionStatus = filters.subscriptionStatus;
      }
      if (filters.singlePhoneNumber) {
        apiFilters.singlePhoneNumber = filters.singlePhoneNumber;
      }
      if (csvPhoneNumbers.length > 0) {
        apiFilters.csvPhoneNumbers = csvPhoneNumbers;
      }

      // Call send notification API
      const result = await adminApi.sendNotification({
        type: notificationType,
        filters: apiFilters,
        message: message,
      });

      // Display success message
      setSendSuccess({
        notificationId: result.notificationId,
        recipientCount: result.recipientCount,
      });

      // Reset form after successful send
      setMessage("");
      setFilters({
        packageTypes: [],
        dateJoinedFrom: "",
        dateJoinedTo: "",
        balanceMin: "",
        balanceMax: "",
        subscriptionStatus: "all",
        singlePhoneNumber: "",
        csvFile: null,
      });
      setCsvFileName("");
      setCsvError("");
      setCsvValidPhoneCount(0);
      setCsvPhoneNumbers([]);
      setCsvValidationErrors([]);
      setRecipientCount(0);

      // Close confirmation dialog
      setShowConfirmDialog(false);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSendSuccess(null);
      }, 5000);
    } catch (error) {
      // Handle errors and display error messages
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send notification";
      setSendError(errorMessage);
      setShowConfirmDialog(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelSend = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Send className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">Send Notification</h2>
      </div>

      {/* Success Message */}
      {sendSuccess && (
        <div className="mb-6 bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-emerald-400 mb-1">
                Notification Sent Successfully
              </h3>
              <p className="text-sm text-emerald-300">
                Your {notificationType} notification has been sent to{" "}
                <span className="font-semibold">
                  {sendSuccess.recipientCount.toLocaleString()}
                </span>{" "}
                recipient{sendSuccess.recipientCount !== 1 ? "s" : ""}.
              </p>
              <p className="text-xs text-emerald-400/70 mt-1">
                Notification ID: {sendSuccess.notificationId}
              </p>
            </div>
            <button
              onClick={() => setSendSuccess(null)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {sendError && (
        <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400 mb-1">
                Error Sending Notification
              </h3>
              <p className="text-sm text-red-300">{sendError}</p>
            </div>
            <button
              onClick={() => setSendError("")}
              className="text-red-400 hover:text-red-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendClick();
        }}
        className="space-y-6"
      >
        {/* Notification Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Notification Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="notificationType"
                value="SMS"
                checked={notificationType === "SMS"}
                onChange={(e) =>
                  setNotificationType(e.target.value as "SMS" | "PUSH")
                }
                className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-white">SMS</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="notificationType"
                value="PUSH"
                checked={notificationType === "PUSH"}
                onChange={(e) =>
                  setNotificationType(e.target.value as "SMS" | "PUSH")
                }
                className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="text-white">Push Notification</span>
              </div>
            </label>
          </div>
        </div>

        {/* Recipient Filters */}
        <div className="space-y-4 border-t border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            Recipient Filters
          </h3>

          {/* Package Type Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Package Type
            </label>
            <div className="flex gap-3">
              {["Bronze", "Silver", "Gold"].map((packageType) => (
                <label
                  key={packageType}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.packageTypes.includes(packageType)}
                    onChange={() => handlePackageTypeChange(packageType)}
                    className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{packageType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Joined Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dateJoinedFrom"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Date Joined From
              </label>
              <input
                type="date"
                id="dateJoinedFrom"
                value={filters.dateJoinedFrom}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateJoinedFrom: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="dateJoinedTo"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Date Joined To
              </label>
              <input
                type="date"
                id="dateJoinedTo"
                value={filters.dateJoinedTo}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateJoinedTo: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Balance Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="balanceMin"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Balance Min
              </label>
              <input
                type="number"
                id="balanceMin"
                value={filters.balanceMin}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    balanceMin: e.target.value,
                  }))
                }
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="balanceMax"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Balance Max
              </label>
              <input
                type="number"
                id="balanceMax"
                value={filters.balanceMax}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    balanceMax: e.target.value,
                  }))
                }
                placeholder="No limit"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subscription Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Subscription Status
            </label>
            <div className="flex gap-4">
              {[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="subscriptionStatus"
                    value={option.value}
                    checked={filters.subscriptionStatus === option.value}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        subscriptionStatus: e.target.value as
                          | "active"
                          | "inactive"
                          | "all",
                      }))
                    }
                    className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Single Phone Number */}
          <div>
            <label
              htmlFor="singlePhoneNumber"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Single Phone Number
            </label>
            <input
              type="tel"
              id="singlePhoneNumber"
              value={filters.singlePhoneNumber}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  singlePhoneNumber: e.target.value,
                }))
              }
              placeholder="+1234567890"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* CSV File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload CSV File
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {csvFileName || "Choose CSV file"}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
              </label>
            </div>
            {csvError && (
              <p className="text-xs text-red-400 mt-1">{csvError}</p>
            )}
            {csvFileName && !csvError && csvValidPhoneCount > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-emerald-400">
                  File selected: {csvFileName}
                </p>
                <p className="text-xs text-emerald-400 font-medium">
                  {csvValidPhoneCount} valid phone number
                  {csvValidPhoneCount !== 1 ? "s" : ""} extracted
                </p>
              </div>
            )}
            {csvValidationErrors.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded">
                <p className="text-xs text-yellow-400 font-medium mb-1">
                  Validation warnings ({csvValidationErrors.length}):
                </p>
                <div className="max-h-24 overflow-y-auto space-y-0.5">
                  {csvValidationErrors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-xs text-yellow-300">
                      {error}
                    </p>
                  ))}
                  {csvValidationErrors.length > 5 && (
                    <p className="text-xs text-yellow-300 italic">
                      ... and {csvValidationErrors.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              CSV should contain phone numbers in the first column. Max 5MB.
            </p>
          </div>
        </div>

        {/* Message Text Area with Character Counter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-300"
            >
              Message
            </label>
            <span className="text-xs text-gray-400">
              {message.length} character{message.length !== 1 ? "s" : ""}
            </span>
          </div>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Enter your notification message..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            maxLength={notificationType === "SMS" ? 1600 : undefined}
          />
          {notificationType === "SMS" && (
            <p className="text-xs text-gray-500 mt-1">
              Maximum 1600 characters for SMS
            </p>
          )}
        </div>

        {/* Recipient Preview Display */}
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">
                Recipients
              </p>
              <p className="text-xs text-gray-500">
                {isLoadingPreview
                  ? "Updating..."
                  : "Select filters to preview recipient count"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {isLoadingPreview ? "..." : recipientCount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">members</p>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!message.trim() || recipientCount === 0}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Notification
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Confirm Send
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  You are about to send a {notificationType} notification to{" "}
                  <span className="font-semibold text-white">
                    {recipientCount.toLocaleString()}
                  </span>{" "}
                  recipient{recipientCount !== 1 ? "s" : ""}.
                </p>
                <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Message Preview:</p>
                  <p className="text-sm text-white break-words">
                    {message.length > 150
                      ? `${message.substring(0, 150)}...`
                      : message}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSend}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
