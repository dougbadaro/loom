import { tokens } from './tokens'

export const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(138, 43, 226, 0.4); }

    .bento-card {
      position: relative;
      overflow: hidden;
      transition: ${tokens.transition};
      border: 1px solid ${tokens.border};
    }
    .bento-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, transparent 40%, rgba(138, 43, 226, 0.18) 100%);
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
    }
    .bento-card:hover {
      transform: scale(1.03) translateY(-2px);
      border-color: ${tokens.borderHover};
      box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(138, 43, 226, 0.2);
    }
    .bento-card:hover::after { opacity: 1; }

    .media-card {
      transition: ${tokens.transition};
      border: 1px solid ${tokens.border};
      border-radius: ${tokens.radius.lg};
      overflow: hidden;
    }
    .media-card:hover {
      transform: scale(1.04) translateY(-3px);
      border-color: rgba(138, 43, 226, 0.45);
      box-shadow: 0 16px 32px rgba(0,0,0,0.5), 0 0 20px rgba(138, 43, 226, 0.12);
    }

    .sidebar-item {
      transition: ${tokens.transitionFast};
      border-radius: ${tokens.radius.md};
      border: 1px solid transparent;
    }
    .sidebar-item:hover:not(.active) {
      background: rgba(255,255,255,0.04) !important;
      color: #ccc !important;
    }
    .sidebar-item.active {
      background: ${tokens.accentDim} !important;
      color: ${tokens.textPrimary} !important;
      border-color: rgba(138, 43, 226, 0.25) !important;
    }

    .tab-btn {
      transition: ${tokens.transitionFast};
      border-radius: ${tokens.radius.sm};
    }
    .tab-btn.active {
      background: rgba(138, 43, 226, 0.2) !important;
      color: ${tokens.textPrimary} !important;
    }
    .tab-btn:not(.active):hover {
      background: rgba(255,255,255,0.05) !important;
      color: #aaa !important;
    }

    .ep-row {
      transition: ${tokens.transitionFast};
      border: 1px solid ${tokens.border};
      border-radius: ${tokens.radius.md};
    }
    .ep-row:hover {
      background: rgba(138, 43, 226, 0.08) !important;
      border-color: rgba(138, 43, 226, 0.3) !important;
    }

    .input-field {
      background: ${tokens.surfaceElevated};
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: ${tokens.radius.md};
      color: ${tokens.textPrimary};
      font-family: ${tokens.font};
      transition: border-color 0.2s ease;
      outline: none;
      width: 100%;
      padding: 14px 16px;
      font-size: 15px;
    }
    .input-field::placeholder { color: ${tokens.textTertiary}; }
    .input-field:focus { border-color: ${tokens.accent}; }

    .btn-back {
      background: none;
      border: none;
      cursor: pointer;
      color: ${tokens.accent};
      font-size: 16px;
      font-weight: 500;
      font-family: ${tokens.font};
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.85;
      transition: opacity 0.2s;
      padding: 0;
    }
    .btn-back:hover { opacity: 1; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeIn 0.3s ease forwards; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner {
      width: 28px; height: 28px;
      border: 2px solid rgba(138, 43, 226, 0.2);
      border-top-color: ${tokens.accent};
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
  `}</style>
)
