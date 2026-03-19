"use client";

import { useState, useRef } from "react";
import { staffApi, Web3UploadResult, Web3ProcessResult } from "@/lib/staff-api";

interface Web3CaseUploadProps {
  visitId: string;
}

type Stage =
  | "idle"
  | "uploading"
  | "uploaded"
  | "processing"
  | "done"
  | "rejected"
  | "error";

export default function Web3CaseUpload({ visitId }: Web3CaseUploadProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<Web3UploadResult | null>(
    null,
  );
  const [processResult, setProcessResult] = useState<Web3ProcessResult | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!beforeFile || !afterFile) return;
    setStage("uploading");
    setErrorMsg("");
    try {
      const result = await staffApi.uploadCaseImages(
        visitId,
        beforeFile,
        afterFile,
      );
      setUploadResult(result);
      setStage("uploaded");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    }
  };

  const handleProcess = async () => {
    setStage("processing");
    setErrorMsg("");
    try {
      const result = await staffApi.processWeb3Case(visitId);
      setProcessResult(result);
      setStage(result.verified ? "done" : "rejected");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
      setStage("error");
    }
  };

  const explorerBase = "https://calibration.filfox.info/en/message";

  return (
    <div className="mt-6 border border-purple-200 rounded-xl bg-purple-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔗</span>
        <h3 className="text-lg font-bold text-purple-900">
          Web3 Impact Verification
        </h3>
        <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-medium">
          Optional
        </span>
      </div>
      <p className="text-sm text-purple-700 mb-4">
        Upload before/after images to Filecoin, verify with AI, and mint a
        Hypercert as proof of dental care impact.
      </p>

      {/* File pickers */}
      {(stage === "idle" || stage === "error") && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Before Treatment Image
            </label>
            <input
              ref={beforeRef}
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              After Treatment Image
            </label>
            <input
              ref={afterRef}
              type="file"
              accept="image/*"
              onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
            />
          </div>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button
            onClick={handleUpload}
            disabled={!beforeFile || !afterFile}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            Upload to Filecoin
          </button>
        </div>
      )}

      {/* Uploading spinner */}
      {stage === "uploading" && (
        <StatusRow icon="⏳" label="Uploading images to Filecoin..." />
      )}

      {/* Uploaded — show CIDs, prompt to process */}
      {stage === "uploaded" && uploadResult && (
        <div className="space-y-3">
          <StatusRow icon="✅" label="Images stored on Filecoin" />
          <CIDRow
            label="Before CID"
            cid={uploadResult.beforeCID}
            url={uploadResult.beforeUrl}
          />
          <CIDRow
            label="After CID"
            cid={uploadResult.afterCID}
            url={uploadResult.afterUrl}
          />
          <button
            onClick={handleProcess}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Run AI Verification + On-Chain Payout
          </button>
        </div>
      )}

      {/* Processing */}
      {stage === "processing" && (
        <div className="space-y-2">
          {uploadResult && (
            <>
              <CIDRow
                label="Before CID"
                cid={uploadResult.beforeCID}
                url={uploadResult.beforeUrl}
              />
              <CIDRow
                label="After CID"
                cid={uploadResult.afterCID}
                url={uploadResult.afterUrl}
              />
            </>
          )}
          <StatusRow
            icon="🤖"
            label="AI agent verifying dental improvement..."
          />
        </div>
      )}

      {/* Rejected */}
      {stage === "rejected" && processResult && (
        <div className="space-y-2">
          <StatusRow icon="❌" label="AI verification rejected" />
          <p className="text-sm text-red-600">
            {processResult.aiResult.reason}
          </p>
          <p className="text-xs text-gray-500">
            Confidence: {(processResult.aiResult.confidence * 100).toFixed(0)}%
          </p>
        </div>
      )}

      {/* Done — full pipeline complete */}
      {stage === "done" && processResult && uploadResult && (
        <div className="space-y-3">
          <StatusRow
            icon="✅"
            label="AI verified — dental improvement confirmed"
          />
          <p className="text-xs text-gray-500">
            Confidence: {(processResult.aiResult.confidence * 100).toFixed(0)}%
          </p>

          <CIDRow
            label="Before CID"
            cid={uploadResult.beforeCID}
            url={uploadResult.beforeUrl}
          />
          <CIDRow
            label="After CID"
            cid={uploadResult.afterCID}
            url={uploadResult.afterUrl}
          />

          {processResult.submitTxHash && (
            <TxRow
              label="Case submitted on-chain"
              txHash={processResult.submitTxHash}
              explorerBase={explorerBase}
            />
          )}
          {processResult.payoutTxHash && (
            <TxRow
              label="Payout released on-chain"
              txHash={processResult.payoutTxHash}
              explorerBase={explorerBase}
            />
          )}
          {processResult.hypercertData && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <span>🏅</span>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Hypercert Minted
                </p>
                <p className="text-xs text-green-600 font-mono">
                  {processResult.hypercertData.mockTokenId}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function CIDRow({
  label,
  cid,
  url,
}: {
  label: string;
  cid: string;
  url: string;
}) {
  return (
    <div className="p-2 bg-white border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-blue-600 hover:underline break-all"
      >
        {cid}
      </a>
    </div>
  );
}

function TxRow({
  label,
  txHash,
  explorerBase,
}: {
  label: string;
  txHash: string;
  explorerBase: string;
}) {
  return (
    <div className="p-2 bg-white border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <a
        href={`${explorerBase}/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-indigo-600 hover:underline break-all"
      >
        {txHash}
      </a>
    </div>
  );
}
