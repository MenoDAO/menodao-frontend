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
      // Kick off background pipeline — returns immediately
      await staffApi.processWeb3Case(visitId);
      // Now poll for completion
      await pollForCompletion();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed");
      setStage("error");
    }
  };

  const pollForCompletion = async () => {
    const MAX_POLLS = 40; // 40 × 5s = 3.3 min max wait
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, 5000)); // wait 5s
      try {
        const status = await staffApi.getWeb3CaseStatus(visitId);
        if (status.web3VerificationStatus === "VERIFIED") {
          // Build a processResult-like object from status
          setProcessResult({
            verified: true,
            aiResult: status.aiVerificationResult || {
              verified: true,
              confidence: 0.9,
              reason: "Verified",
            },
            caseId: status.caseOnChainId ?? undefined,
            submitTxHash: status.onChainTxHash ?? undefined,
            payoutTxHash: status.payoutTxHash ?? undefined,
            hypercertData: status.hypercertData ?? undefined,
          });
          setStage("done");
          return;
        }
        if (status.web3VerificationStatus === "REJECTED") {
          setProcessResult({
            verified: false,
            aiResult: status.aiVerificationResult || {
              verified: false,
              confidence: 0,
              reason: "Rejected by AI agent",
            },
          });
          setStage("rejected");
          return;
        }
        // Still PENDING — keep polling
      } catch {
        // transient poll error — keep trying
      }
    }
    setErrorMsg("Verification timed out — check back in a moment");
    setStage("error");
  };

  const calibrationExplorer = "https://calibration.filfox.info/en/message";

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
        Upload before/after images to IPFS via Pinata, verify with AI on
        Filecoin Calibration, and mint a Hypercert as proof of dental care
        impact.
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
            Upload to IPFS (Pinata/Filecoin)
          </button>
        </div>
      )}

      {stage === "uploading" && (
        <StatusRow icon="⏳" label="Uploading images to IPFS via Pinata..." />
      )}

      {stage === "uploaded" && uploadResult && (
        <div className="space-y-3">
          <StatusRow
            icon="✅"
            label="Images pinned to IPFS — CIDs recorded on Filecoin"
          />
          <CIDRow
            label="Before CID"
            cid={uploadResult.beforeCID}
            gatewayUrl={uploadResult.beforeUrl}
            explorerUrl={uploadResult.beforeExplorerUrl}
          />
          <CIDRow
            label="After CID"
            cid={uploadResult.afterCID}
            gatewayUrl={uploadResult.afterUrl}
            explorerUrl={uploadResult.afterExplorerUrl}
          />
          <button
            onClick={handleProcess}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Run AI Verification + On-Chain Payout
          </button>
        </div>
      )}

      {stage === "processing" && (
        <div className="space-y-2">
          {uploadResult && (
            <>
              <CIDRow
                label="Before CID"
                cid={uploadResult.beforeCID}
                gatewayUrl={uploadResult.beforeUrl}
                explorerUrl={uploadResult.beforeExplorerUrl}
              />
              <CIDRow
                label="After CID"
                cid={uploadResult.afterCID}
                gatewayUrl={uploadResult.afterUrl}
                explorerUrl={uploadResult.afterExplorerUrl}
              />
            </>
          )}
          <StatusRow
            icon="🤖"
            label="AI agent verifying on Calibration testnet — polling every 5s, please wait..."
          />
        </div>
      )}

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
            gatewayUrl={uploadResult.beforeUrl}
            explorerUrl={uploadResult.beforeExplorerUrl}
          />
          <CIDRow
            label="After CID"
            cid={uploadResult.afterCID}
            gatewayUrl={uploadResult.afterUrl}
            explorerUrl={uploadResult.afterExplorerUrl}
          />

          {processResult.submitTxHash && (
            <TxRow
              label="Case submitted on Calibration testnet"
              txHash={processResult.submitTxHash}
              explorerBase={calibrationExplorer}
            />
          )}
          {processResult.payoutTxHash && (
            <TxRow
              label="Payout released on-chain"
              txHash={processResult.payoutTxHash}
              explorerBase={calibrationExplorer}
            />
          )}
          {processResult.hypercertData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span>🏅</span>
                <p className="text-sm font-semibold text-green-800">
                  Hypercert Impact Proof Created
                </p>
              </div>
              <p className="text-xs font-mono text-green-700">
                {processResult.hypercertData.mockTokenId}
              </p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>Attester: MenoDAO (verified &amp; funded care)</p>
                <p>
                  Clinic:{" "}
                  {processResult.hypercertData.clinicAddress.slice(0, 10)}...
                </p>
                <p>Beneficiary: patient visit</p>
              </div>
              {processResult.hypercertData.metadataUrl && (
                <a
                  href={processResult.hypercertData.metadataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline block"
                >
                  View impact metadata on IPFS ↗
                </a>
              )}
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
  gatewayUrl,
  explorerUrl,
}: {
  label: string;
  cid: string;
  gatewayUrl: string;
  explorerUrl?: string;
}) {
  return (
    <div className="p-2 bg-white border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xs font-mono text-gray-800 break-all mb-1">{cid}</p>
      <div className="flex gap-3 flex-wrap">
        <a
          href={gatewayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View on IPFS ↗
        </a>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:underline"
          >
            Explore on IPLD ↗
          </a>
        )}
      </div>
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
        {txHash} ↗
      </a>
    </div>
  );
}
