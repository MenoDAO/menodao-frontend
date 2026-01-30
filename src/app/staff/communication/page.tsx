"use client";

import { useState, useEffect } from "react";
import {
  ChatBubbleBottomCenterTextIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { staffApi } from "@/lib/staff-api";

export default function CommunicationPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchMembers();
  }, [selectedBranch]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getMembers(selectedBranch || undefined);
      setMembers(data);
      // Automatically select all members in the current view
      setSelectedMembers(data.map((m: any) => m.phoneNumber));
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message || selectedMembers.length === 0) return;

    setSending(true);
    setResult(null);
    try {
      const resp = await staffApi.sendBulkSms(selectedMembers, message);
      setResult(resp);
      setMessage("");
    } catch (error: any) {
      console.error("Failed to send SMS:", error);
      setResult({ error: error.message || "Failed to send messages" });
    } finally {
      setSending(false);
    }
  };

  const toggleMember = (phone: string) => {
    setSelectedMembers((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone],
    );
  };

  const selectAll = () => {
    setSelectedMembers(members.map((m) => m.phoneNumber));
  };

  const selectNone = () => {
    setSelectedMembers([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Communication Center
        </h1>
        <p className="text-gray-500">
          Send bulk updates and notifications to members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Recipient Selection */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2 text-primary" />
              Recipients
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                  Filter by Branch
                </label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Eldoret">Eldoret</option>
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedMembers.length} Selected
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-primary hover:underline"
                    >
                      All
                    </button>
                    <button
                      onClick={selectNone}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {loading ? (
                    <p className="text-xs text-center py-4 text-gray-400 font-medium">
                      Loading members...
                    </p>
                  ) : members.length === 0 ? (
                    <p className="text-xs text-center py-4 text-gray-400 font-medium">
                      No members found
                    </p>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => toggleMember(member.phoneNumber)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedMembers.includes(member.phoneNumber)
                            ? "bg-primary/5 border-primary/20"
                            : "bg-white border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                            {member.fullName || member.phoneNumber}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedMembers.includes(member.phoneNumber)
                                ? "bg-primary border-primary"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedMembers.includes(member.phoneNumber) && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {member.phoneNumber}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Composer */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 h-full flex flex-col">
            <h2 className="font-bold text-gray-900 flex items-center">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-primary" />
              Compose Message
            </h2>

            <div className="flex-1 space-y-4">
              <textarea
                placeholder="Type your message here..."
                className="w-full h-48 p-6 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none resize-none text-gray-700 leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>

              <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                <span>{message.length} characters</span>
                <span>{Math.ceil(message.length / 160)} SMS units</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              {result && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                    result.error
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {result.error ? (
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {result.error
                        ? "Failed to send"
                        : "Communication successful"}
                    </p>
                    <p className="text-xs opacity-90">
                      {result.error
                        ? result.error
                        : `Successfully sent ${result.successful} messages to ${result.total} recipients.`}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !message || selectedMembers.length === 0}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  sending || !message || selectedMembers.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                }`}
              >
                {sending ? (
                  <>
                    <ClockIcon className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
