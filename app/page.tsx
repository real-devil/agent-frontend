"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Document {
  document_id: string;
  filename: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchDocuments() {
    try {
      const res = await fetch(`${API_BASE}/document/list`);
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0 && !selectedDocId) {
        setSelectedDocId(data[0].document_id);
      }
    } catch {
      // ignore
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/document/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setUploadError(err.detail || "上传失败");
      } else {
        await fetchDocuments();
      }
    } catch {
      setUploadError("网络错误，请检查后端是否启动");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          document_id: selectedDocId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `错误：${err.detail || "请求失败"}` },
        ]);
      } else {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络错误，请检查后端是否启动" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r flex flex-col p-4 gap-4">
        <h1 className="text-lg font-bold text-gray-800">RAG 问答系统</h1>

        {/* 上传 */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">上传文档</p>
          <label className="flex items-center justify-center w-full h-10 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition-colors">
            <span className="text-sm text-gray-500">
              {uploading ? "上传中..." : "选择 PDF / Word"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
        </div>

        {/* 文档列表 */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-sm font-medium text-gray-600 mb-2">已上传文档</p>
          {documents.length === 0 ? (
            <p className="text-xs text-gray-400">暂无文档</p>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li key={doc.document_id}>
                  <button
                    onClick={() => setSelectedDocId(doc.document_id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg truncate transition-colors ${
                      selectedDocId === doc.document_id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    title={doc.filename}
                  >
                    {doc.filename}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 当前选中 */}
        <div className="text-xs text-gray-400 border-t pt-2">
          {selectedDocId
            ? `当前：${documents.find((d) => d.document_id === selectedDocId)?.filename}`
            : "未选择文档（全局对话）"}
        </div>
      </aside>

      {/* 主区域 */}
      <main className="flex flex-col flex-1">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              选择文档后开始提问
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-sm text-gray-400">
                思考中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题，Enter 发送，Shift+Enter 换行"
              rows={2}
              className="flex-1 resize-none border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-10 px-5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
