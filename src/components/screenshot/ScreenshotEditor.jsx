import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import {
  Download,
  Copy,
  X,
  Check,
  Pen,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  MousePointer,
  Minus as LineIcon,
} from "lucide-react";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ffffff",
  "#000000",
];
const STROKE_SIZES = [2, 4, 6, 10];

const TOOLS = [
  { id: "select", icon: MousePointer, label: "Select / Move" },
  { id: "pen", icon: Pen, label: "Freehand Draw" },
  { id: "line", icon: LineIcon, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Ellipse" },
  { id: "text", icon: Type, label: "Text" },
];

export function ScreenshotEditor({ imageUrl, onClose }) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef({ x: 0, y: 0 });
  const activeShapeRef = useRef(null);

  const [tool, setTool] = useState("select");
  const [color, setColor] = useState("#ef4444");
  const [size, setSize] = useState(4);
  const [copied, setCopied] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Init Fabric canvas
  useEffect(() => {
    if (!canvasElRef.current || !imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const maxW = window.innerWidth - 48;
      const maxH = window.innerHeight - 160;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const displayScale = Math.min(1, maxW / naturalW, maxH / naturalH);
      const displayW = Math.round(naturalW * displayScale);
      const displayH = Math.round(naturalH * displayScale);

      // Use display size for canvas — avoids Fabric.js v7 coordinate bugs
      const fc = new fabric.Canvas(canvasElRef.current, {
        width: displayW,
        height: displayH,
        selection: true,
        preserveObjectStacking: true,
      });

      // Store multiplier for full-res export
      fc._exportMultiplier = 1 / displayScale;
      fabricRef.current = fc;

      fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" }).then(
        (fImg) => {
          // Scale image to fit canvas display size
          fImg.set({
            left: 0,
            top: 0,
            scaleX: displayW / fImg.width,
            scaleY: displayH / fImg.height,
            selectable: false,
            evented: false,
            hasControls: false,
          });
          fc.backgroundImage = fImg;
          fc.renderAll();
          saveHistory();
        },
      );

      fc.on("object:added", () => {
        redoRef.current = [];
        updateUndoRedo();
      });
      fc.on("object:modified", () => {
        redoRef.current = [];
        saveHistory();
        updateUndoRedo();
      });
    };
    img.src = imageUrl;

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [imageUrl]);

  const saveHistory = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    historyRef.current.push(JSON.stringify(fc.toJSON(["backgroundImage"])));
    if (historyRef.current.length > 50) historyRef.current.shift();
    updateUndoRedo();
  }, []);

  const updateUndoRedo = () => {
    setCanUndo(historyRef.current.length > 1);
    setCanRedo(redoRef.current.length > 0);
  };

  const undo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || historyRef.current.length <= 1) return;
    redoRef.current.push(historyRef.current.pop());
    const prev = historyRef.current[historyRef.current.length - 1];
    fc.loadFromJSON(JSON.parse(prev)).then(() => {
      fc.backgroundImage && fc.renderAll();
      updateUndoRedo();
    });
  }, []);

  const redo = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !redoRef.current.length) return;
    const next = redoRef.current.pop();
    historyRef.current.push(next);
    fc.loadFromJSON(JSON.parse(next)).then(() => {
      fc.backgroundImage && fc.renderAll();
      updateUndoRedo();
    });
  }, []);

  // Apply tool changes
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    // Reset
    fc.isDrawingMode = false;
    fc.selection = tool === "select";
    fc.off("mouse:down");
    fc.off("mouse:move");
    fc.off("mouse:up");
    fc.getObjects().forEach((o) => {
      o.selectable = tool === "select";
    });
    fc.renderAll();

    if (tool === "pen") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush = new fabric.PencilBrush(fc);
      fc.freeDrawingBrush.color = color;
      fc.freeDrawingBrush.width = size * 2;
      fc.on("path:created", saveHistory);
      return;
    }

    if (tool === "text") {
      fc.on("mouse:down", (opt) => {
        const ptr = fc.getScenePoint(opt.e);
        const text = new fabric.IText("Click to type...", {
          left: ptr.x,
          top: ptr.y,
          fill: color,
          fontSize: size * 8,
          fontFamily: "Inter, sans-serif",
          fontWeight: "bold",
          editable: true,
        });
        fc.add(text);
        fc.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveHistory();
      });
      return;
    }

    // Shape tools
    if (["rect", "circle", "line", "arrow"].includes(tool)) {
      fc.on("mouse:down", (opt) => {
        const ptr = fc.getScenePoint(opt.e);
        isDrawingShapeRef.current = true;
        shapeStartRef.current = { x: ptr.x, y: ptr.y };
        const commonProps = {
          stroke: color,
          strokeWidth: size * 2,
          fill: "transparent",
          selectable: false,
        };

        let shape;
        if (tool === "rect") {
          shape = new fabric.Rect({
            ...commonProps,
            left: ptr.x,
            top: ptr.y,
            width: 1,
            height: 1,
          });
        } else if (tool === "circle") {
          shape = new fabric.Ellipse({
            ...commonProps,
            left: ptr.x,
            top: ptr.y,
            rx: 1,
            ry: 1,
          });
        } else if (tool === "line") {
          shape = new fabric.Line([ptr.x, ptr.y, ptr.x, ptr.y], {
            ...commonProps,
            fill: color,
          });
        } else if (tool === "arrow") {
          shape = new fabric.Line([ptr.x, ptr.y, ptr.x, ptr.y], {
            ...commonProps,
            fill: color,
          });
        }

        activeShapeRef.current = shape;
        fc.add(shape);
      });

      fc.on("mouse:move", (opt) => {
        if (!isDrawingShapeRef.current || !activeShapeRef.current) return;
        const ptr = fc.getScenePoint(opt.e);
        const { x: x1, y: y1 } = shapeStartRef.current;
        const shape = activeShapeRef.current;

        if (tool === "rect") {
          shape.set({
            left: Math.min(x1, ptr.x),
            top: Math.min(y1, ptr.y),
            width: Math.abs(ptr.x - x1),
            height: Math.abs(ptr.y - y1),
          });
        } else if (tool === "circle") {
          shape.set({
            left: Math.min(x1, ptr.x),
            top: Math.min(y1, ptr.y),
            rx: Math.abs(ptr.x - x1) / 2,
            ry: Math.abs(ptr.y - y1) / 2,
          });
        } else if (tool === "line" || tool === "arrow") {
          shape.set({ x2: ptr.x, y2: ptr.y });
        }
        fc.renderAll();
      });

      fc.on("mouse:up", (opt) => {
        if (!isDrawingShapeRef.current) return;
        isDrawingShapeRef.current = false;

        if (tool === "arrow" && activeShapeRef.current) {
          const line = activeShapeRef.current;
          const x1 = line.x1,
            y1 = line.y1,
            x2 = line.x2,
            y2 = line.y2;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const hl = Math.max(15, size * 5);
          const triangle = new fabric.Triangle({
            left: x2,
            top: y2,
            width: hl,
            height: hl,
            fill: color,
            stroke: color,
            angle: (angle * 180) / Math.PI + 90,
            originX: "center",
            originY: "center",
            selectable: false,
          });
          fc.add(triangle);
        }

        activeShapeRef.current = null;
        saveHistory();
      });
    }
  }, [tool, color, size, saveHistory]);

  // Update brush color/size when they change
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || tool !== "pen") return;
    if (fc.freeDrawingBrush) {
      fc.freeDrawingBrush.color = color;
      fc.freeDrawingBrush.width = size * 2;
    }
  }, [color, size, tool]);

  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    if (active.length) {
      fc.remove(...active);
      fc.discardActiveObject();
      saveHistory();
    }
  }, [saveHistory]);

  const clearAll = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.getObjects().forEach((o) => fc.remove(o));
    saveHistory();
  }, [saveHistory]);

  const download = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const dataURL = fc.toDataURL({
      format: "png",
      multiplier: fc._exportMultiplier || 1,
    });
    const link = document.createElement("a");
    link.download = `screenshot-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const copy = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const dataURL = fc.toDataURL({
      format: "png",
      multiplier: fc._exportMultiplier || 1,
    });
    const res = await fetch(dataURL);
    const blob = await res.blob();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "CANVAS") deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, undo, redo, deleteSelected]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col"
      style={{ background: "#0f0f12" }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Tools */}
        <div
          className="flex items-center gap-1 rounded-[12px] p-1"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all cursor-pointer"
              style={{
                background:
                  tool === id ? "rgba(139,92,246,0.35)" : "transparent",
                color: tool === id ? "#a78bfa" : "rgba(255,255,255,0.45)",
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <div
          className="w-px h-6"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
              style={{
                background: c,
                borderColor: color === c ? "white" : "transparent",
                transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow:
                  c === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.25)" : "none",
              }}
            />
          ))}
        </div>

        <div
          className="w-px h-6"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />

        {/* Stroke sizes */}
        <div className="flex items-center gap-1.5">
          {STROKE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all cursor-pointer"
              style={{
                background:
                  size === s ? "rgba(255,255,255,0.12)" : "transparent",
              }}
            >
              <div
                className="rounded-full bg-white"
                style={{
                  width: s * 2.5,
                  height: s * 2.5,
                  opacity: size === s ? 1 : 0.35,
                }}
              />
            </button>
          ))}
        </div>

        <div
          className="w-px h-6"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />

        {/* Undo / Redo / Delete */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all cursor-pointer disabled:opacity-30"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘Y)"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all cursor-pointer disabled:opacity-30"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={deleteSelected}
          title="Delete selected"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all cursor-pointer"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <Trash2 size={16} />
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>

        <button
          onClick={download}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
          style={{ background: "#7c3aed", color: "white" }}
        >
          <Download size={14} /> Download
        </button>

        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] cursor-pointer transition-all"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <canvas
          ref={canvasElRef}
          style={{
            borderRadius: 8,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
          }}
        />
      </div>

      {/* ── Hint bar ── */}
      <div
        className="text-center py-2 text-[11px] shrink-0"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        {tool === "select" &&
          "Click to select · Delete key to remove · Drag to move"}
        {tool === "pen" && "Click and drag to draw freely"}
        {tool === "text" &&
          "Click on canvas to add text · Double-click to edit"}
        {tool === "arrow" && "Drag to draw arrow"}
        {["rect", "circle", "line"].includes(tool) &&
          "Click and drag to draw shape"}
        {" · ⌘Z undo · ⌘Y redo"}
      </div>
    </div>
  );
}
