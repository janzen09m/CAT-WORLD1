import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerData, KeyType, Theme } from '../types/game';
import { KEY_EXCHANGE_RATES } from '../data/chestsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Key, X, Coins, Check, AlertCircle, ShoppingCart } from 'lucide-react';

interface BuyKeysModalProps {
  player: PlayerData;
  onClose: () => void;
  onBuyKey?: (keyType: KeyType, amount: number) => Promise<any>;
  onConvert?: (keyType: KeyType, amount: number) => Promise<any>;
  theme?: Theme;
}

export const ConvertKeysModal: React.FC<BuyKeysModalProps> = ({
  player,
  onClose,
  onBuyKey,
  onConvert,
  theme = 'light',
}) => {
  const [selectedKey, setSelectedKey] = useState<KeyType>('wooden');
  const [amount, setAmount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ keyName: string; amount: number; totalCost: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLight = theme === 'light';
  const rate = KEY_EXCHANGE_RATES[selectedKey];
  const totalCost = rate.coinPrice * amount;
  const canAfford = player.coins >= totalCost;
  const currentKeyStock = player.keys[selectedKey] || 0;

  const handlePurchase = async () => {
    if (amount <= 0 || !canAfford || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    soundManager.playClick();
    triggerHaptic('medium');

    try {
      if (onBuyKey) {
        await onBuyKey(selectedKey, amount);
      } else if (onConvert) {
        await onConvert(selectedKey, amount);
      }

      soundManager.playCoin();
      triggerHaptic('success');
      setSuccessInfo({
        keyName: rate.name,
        amount,
        totalCost,
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });

      setAmount(1);
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Key purchase failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-amber-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/30 text-white'
      }`}>
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isLight
              ? 'bg-slate-100 text-slate-500 hover:text-slate-900'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 mb-1">
            <Key className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Buy Chest Keys</h2>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
            Spend coins to unlock treasure chests and get rare cats!
          </p>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border mt-1 ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
          }`}>
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Balance: {player.coins.toLocaleString('en-US')} Coins</span>
          </div>
        </div>

        {/* Success notification */}
        {successInfo && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center text-xs text-emerald-800 flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Purchased <strong>{successInfo.amount}x {successInfo.keyName}</strong> for <strong>{successInfo.totalCost.toLocaleString('en-US')} Coins</strong>! 🗝️</span>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center text-xs text-rose-800 flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Key Type Selection Grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {(Object.keys(KEY_EXCHANGE_RATES) as KeyType[]).map(kType => {
            const kRate = KEY_EXCHANGE_RATES[kType];
            const stock = player.keys[kType] || 0;
            const isSelected = selectedKey === kType;

            return (
              <button
                key={kType}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedKey(kType);
                  setSuccessInfo(null);
                  setErrorMsg(null);
                }}
                className={`p-2 rounded-2xl flex flex-col items-center justify-between text-center transition-all border ${
                  isSelected
                    ? isLight
                      ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400/50'
                      : 'border-amber-400 bg-amber-500/15 shadow-md ring-2 ring-amber-400/50'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <span className="text-xl my-0.5">🗝️</span>
                <span className={`text-[10px] font-black truncate w-full ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {kRate.name.replace(' Key', '')}
                </span>
                <span className="text-[9px] font-mono text-amber-500 font-bold mt-0.5">
                  {kRate.coinPrice}🪙
                </span>
                <span className={`text-[8px] font-mono mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                  x{stock}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Key Details */}
        <div className={`rounded-2xl p-3 text-xs mb-4 border space-y-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className={isLight ? 'text-slate-900' : 'text-white'}>{rate.name}</span>
            <span className="text-amber-500 font-mono">{rate.coinPrice} Coins each</span>
          </div>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {rate.description}
          </p>
          <div className={`text-[10px] font-mono pt-1 border-t ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-700 text-slate-400'}`}>
            Current Inventory: <strong>{currentKeyStock}x in stock</strong>
          </div>
        </div>

        {/* Quantity Selectors */}
        <div className="space-y-1.5 mb-4">
          <label className={`text-xs font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Select Quantity:
          </label>
          <div className="flex items-center gap-2">
            <div className={`flex items-center rounded-xl border p-1 shrink-0 ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setAmount(prev => Math.max(1, prev - 1));
                }}
                disabled={amount <= 1}
                className="w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
              >
                -
              </button>
              <span className={`w-8 text-center font-mono font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {amount}
              </span>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setAmount(prev => prev + 1);
                }}
                className="w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center hover:bg-slate-100"
              >
                +
              </button>
            </div>

            {/* Quick amount presets */}
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              {[1, 5, 10].map(qty => (
                <button
                  key={qty}
                  onClick={() => {
                    soundManager.playClick();
                    setAmount(qty);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold font-mono border transition-all ${
                    amount === qty
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total Cost & Buy CTA */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Total Price:</span>
            <span className={`font-mono font-black text-sm ${canAfford ? 'text-amber-500' : 'text-rose-500'}`}>
              {totalCost.toLocaleString('en-US')} Coins
            </span>
          </div>

          <button
            onClick={handlePurchase}
            disabled={!canAfford || isSubmitting}
            className={`w-full py-3 px-4 font-black rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              canAfford
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Purchasing...'
                : canAfford
                ? `Buy ${amount}x ${rate.name} (${totalCost.toLocaleString('en-US')} Coins)`
                : `Need ${(totalCost - player.coins).toLocaleString('en-US')} More Coins`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BuyKeysModal = ConvertKeysModal;
