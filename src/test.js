import React, { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Download,
  Link2,
  Lock,
  MessageCircle,
  Send,
  MoreVertical,
} from "lucide-react";

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [comment, setComment] = useState("");

  const comments = [
    {
      name: "Mansoor",
      time: "00:34",
      text: "This is the section where I explain the homepage layout.",
    },
    {
      name: "Client",
      time: "02:14",
      text: "Can we make this section slightly shorter?",
    },
    {
      name: "Mansoor",
      time: "04:52",
      text: "Please review this CTA placement.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">VMI Screen Recorder</h1>
            <p className="text-sm text-gray-500">Private client video</p>
          </div>

          <button className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Sign in
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Website Homepage Walkthrough
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Shared by Mansoor Alam · 8 min 42 sec
              </p>
            </div>

            <button className="rounded-full p-2 hover:bg-white">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-black shadow-xl">
            <div className="flex aspect-video items-center justify-center bg-neutral-900">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-black shadow-lg hover:bg-white"
              >
                {isPlaying ? <Pause size={34} /> : <Play size={34} />}
              </button>
            </div>

            <div className="bg-black px-5 py-4 text-white">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[38%] rounded-full bg-white" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <span className="text-sm text-white/80">03:18 / 08:42</span>

                  <button>
                    <Volume2 size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <select className="rounded-md bg-white/10 px-2 py-1 text-sm text-black">
                    <option>1x</option>
                    <option>1.25x</option>
                    <option>1.5x</option>
                    <option>2x</option>
                  </select>

                  <button>
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              <Link2 size={16} />
              Copy link
            </button>

            <button className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <Download size={16} />
              Download MP4
            </button>

            <button className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <Lock size={16} />
              Unlisted
            </button>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Video notes</h3>
            <p className="text-sm leading-6 text-gray-600">
              This walkthrough explains the proposed homepage structure,
              above-the-fold section, services layout, and recommended CTA
              placement for the new website.
            </p>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <MessageCircle size={20} />
            <h3 className="text-lg font-semibold">Comments</h3>
          </div>

          <div className="mb-5 rounded-xl border bg-gray-50 p-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment at 03:18..."
              className="h-24 w-full resize-none bg-transparent text-sm outline-none"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                Timestamp: 03:18
              </span>

              <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black">
                <Send size={14} />
                Send
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {comments.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="mb-1 flex items-center justify-between">
                  <strong className="text-sm">{item.name}</strong>
                  <button className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
                    {item.time}
                  </button>
                </div>

                <p className="text-sm leading-5 text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
