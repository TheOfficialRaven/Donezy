import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Gem, Palette, Image, Crown, Star, Lock, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'icons' | 'backgrounds' | 'premium';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
  isPremium?: boolean;
}

const shopItems: ShopItem[] = [
  { id: '1', name: 'Cyberpunk téma', description: 'Futurisztikus neon színekkel és hatásokkal', price: 150, category: 'theme', rarity: 'epic', preview: 'linear-gradient(135deg, #ff00ff, #00ffff)' },
  { id: '2', name: 'Természet téma', description: 'Nyugtató zöld árnyalatok és organikus formák', price: 100, category: 'theme', rarity: 'rare', preview: 'linear-gradient(135deg, #4ade80, #22c55e)' },
  { id: '3', name: 'Minimál ikoncsomag', description: '50+ letisztult, modern ikon', price: 75, category: 'icons', rarity: 'rare', preview: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { id: '4', name: 'Űr háttércsomag', description: 'Galaktikus háttérképek és animációk', price: 200, category: 'backgrounds', rarity: 'epic', preview: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { id: '5', name: 'Arany koronás profil', description: 'Exkluzív profilkeret és státusz', price: 500, category: 'premium', rarity: 'legendary', preview: 'linear-gradient(135deg, #fbbf24, #f59e0b)', isPremium: true },
  { id: '6', name: 'Hologram téma', description: 'Holografikus felület futurisztikus glow-val', price: 300, category: 'theme', rarity: 'legendary', preview: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }
];

const categoryLabels = { theme: 'Témák', icons: 'Ikonok', backgrounds: 'Hátterek', premium: 'Prémium' };
const categoryIcons = { theme: Palette, icons: Star, backgrounds: Image, premium: Crown };
const rarityConfig = {
  common: { label: 'Gyakori', color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' },
  rare: { label: 'Ritka', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
  epic: { label: 'Epikus', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
  legendary: { label: 'Legendás', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' }
};

export default function Shop() {
  const { userStats, updateStats } = useAppStore();
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(shopItems.map(item => item.category)));
  const canAfford = (price: number) => userStats.essence >= price;

  const handlePurchase = async (item: ShopItem) => {
    if (!canAfford(item.price) || purchasedItems.has(item.id)) return;

    try {
      await updateStats({ essence: userStats.essence - item.price });
      setPurchasedItems(new Set([...purchasedItems, item.id]));
      toast.success(`${item.name} megvásárolva!`);
    } catch {
      toast.error('Hiba történt a vásárlás során.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-secondary to-warning rounded-full flex items-center justify-center glow-secondary">
            <ShoppingBag className="h-10 w-10 text-surface-0" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-2">Essence Bolt</h1>
          <p className="text-lg text-text-secondary">Vásárolj témákat, ikonokat és prémium funkciókat</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="glass p-4 inline-flex items-center gap-3">
            <Gem className="h-6 w-6 text-secondary" />
            <div>
              <span className="text-2xl font-bold text-text-primary">{userStats.essence.toLocaleString()}</span>
              <span className="text-text-muted ml-2">Essence</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {categories.map((category, ci) => {
        const items = shopItems.filter(i => i.category === category);
        const Icon = categoryIcons[category as keyof typeof categoryIcons];
        return (
          <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + ci * 0.1 }} className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-3">
              <Icon className="h-6 w-6 text-primary" />{categoryLabels[category as keyof typeof categoryLabels]}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => {
                const rarity = rarityConfig[item.rarity];
                const affordable = canAfford(item.price);
                const owned = purchasedItems.has(item.id);
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.1 }}>
                    <Card className={cn("glass p-6 hover-lift relative overflow-hidden", rarity.borderColor, "border")}>
                      {item.isPremium && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-warning/20 text-warning border-warning/30"><Crown className="h-3 w-3 mr-1" />Prémium</Badge>
                        </div>
                      )}
                      <div className="relative mb-4">
                        <div className="w-full h-24 rounded-lg mb-3" style={{ background: item.preview }} />
                        <Badge className={cn("absolute top-2 left-2 text-xs", rarity.bgColor, rarity.color, rarity.borderColor)}>{rarity.label}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-heading font-semibold text-text-primary mb-1">{item.name}</h3>
                          <p className="text-sm text-text-secondary">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Gem className="h-4 w-4 text-secondary" />
                            <span className={cn("font-semibold", affordable ? "text-text-primary" : "text-danger")}>{item.price.toLocaleString()}</span>
                          </div>
                          {owned ? (
                            <Button variant="outline" size="sm" className="border-success text-success hover:bg-success/10" disabled>
                              <Download className="h-4 w-4 mr-2" />Birtokolt
                            </Button>
                          ) : (
                            <Button onClick={() => handlePurchase(item)} disabled={!affordable} size="sm"
                              className={cn(affordable ? "bg-secondary hover:bg-secondary/90 text-surface-0" : "bg-surface-2 text-text-disabled cursor-not-allowed")}>
                              {affordable ? 'Vásárlás' : <><Lock className="h-4 w-4 mr-2" />Nincs elég</>}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <Card className="glass p-8 text-center border border-primary/30">
          <Star className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Hamarosan még több!</h3>
          <p className="text-text-secondary mb-4">Új témák, funkciók és exkluzív tartalmak érkeznek</p>
          <Badge className="bg-primary/20 text-primary border-primary/30">Fejlesztés alatt</Badge>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
        <Card className="glass p-6">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Gem className="h-5 w-5 text-secondary" />Hogyan szerezz több Essence-t?
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: Star, color: 'primary', title: 'Küldetések teljesítése', desc: '+10-50 Essence küldetésenként' },
              { icon: Crown, color: 'success', title: 'Eredmények feloldása', desc: '+25-100 Essence eredményenként' },
              { icon: Star, color: 'warning', title: 'Napi belépés', desc: '+5-20 Essence naponta' },
              { icon: Star, color: 'secondary', title: 'Szint emelkedés', desc: '+50-200 Essence szintenként' },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-1/30">
                <div className={`w-8 h-8 rounded-lg bg-${tip.color}/20 flex items-center justify-center`}>
                  <tip.icon className={`h-4 w-4 text-${tip.color}`} />
                </div>
                <div>
                  <div className="font-medium text-text-primary text-sm">{tip.title}</div>
                  <div className="text-xs text-text-muted">{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
