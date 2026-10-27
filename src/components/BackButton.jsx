import React from 'react';

export default function BackButton({ onClick }) {
  return (
    <div className="w-full max-w-md mx-auto mb-3" dir="rtl">
      <button 
        type="button" 
        onClick={onClick} 
        className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-700 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
      >
        <span>←</span> الرجوع للخلف
      </button>
    </div>
  );
}