'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { ClothingItem, Formalidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, Shirt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const categorias = ['Vestido', 'Calça', 'Blusa', 'Sapato', 'Blazer', 'Saia', 'Camisa', 'Tênis', 'Jaqueta', 'Shorts', 'Moletom', 'Casaco'];
const formalidades: Formalidade[] = ['Formal', 'Esporte Fino', 'Casual', 'Informal'];

const coresComuns = [
  { nome: 'Preto', hex: '#1a1a1a' },
  { nome: 'Branco', hex: '#f5f5f5' },
  { nome: 'Azul', hex: '#2563eb' },
  { nome: 'Vermelho', hex: '#dc2626' },
  { nome: 'Verde', hex: '#16a34a' },
  { nome: 'Amarelo', hex: '#eab308' },
  { nome: 'Laranja', hex: '#ea580c' },
  { nome: 'Roxo', hex: '#9333ea' },
  { nome: 'Rosa', hex: '#ec4899' },
  { nome: 'Marrom', hex: '#92400e' },
  { nome: 'Cinza', hex: '#6b7280' },
  { nome: 'Bege', hex: '#d4a574' },
  { nome: 'Azul Marinho', hex: '#1e3a8a' },
  { nome: 'Verde Militar', hex: '#4d7c0f' },
];

interface WardrobeManagerProps {
  onDataUpdate?: () => void;
}

export default function WardrobeManager({ onDataUpdate }: WardrobeManagerProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cor, setCor] = useState('');
  const [formalidadesSelecionadas, setFormalidadesSelecionadas] = useState<Formalidade[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'clothingItems'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as ClothingItem[];
      setItems(itemsData);
      if (onDataUpdate) {
        onDataUpdate();
      }
    });

    return () => unsubscribe();
  }, [user, onDataUpdate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande! Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFormalidade = (formalidade: Formalidade) => {
    setFormalidadesSelecionadas(prev => {
      if (prev.includes(formalidade)) {
        return prev.filter(f => f !== formalidade);
      } else {
        return [...prev, formalidade];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado!');
      return;
    }

    if (!nome || !categoria || !cor || formalidadesSelecionadas.length === 0) {
      toast.error('Preencha todos os campos e selecione ao menos uma formalidade!');
      return;
    }

    if (!imagePreview) {
      toast.error('Adicione uma foto da peça!');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'clothingItems'), {
        userId: user.uid,
        nome,
        categoria,
        cor,
        formalidade: formalidadesSelecionadas.length === 1 ? formalidadesSelecionadas[0] : formalidadesSelecionadas,
        status: 'Limpo',
        imageUrl: imagePreview,
        createdAt: new Date(),
      });

      toast.success('Peça adicionada com sucesso! 🎉');
      setNome('');
      setCategoria('');
      setCor('');
      setFormalidadesSelecionadas([]);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao adicionar peça:', error);
      toast.error('Erro ao adicionar peça');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clothingItems', id));
      toast.success('Peça removida!');
    } catch (error) {
      console.error('Erro ao remover peça:', error);
      toast.error('Erro ao remover peça');
    }
  };

  const getCorHex = (corNome: string): string => {
    const corEncontrada = coresComuns.find(c => c.nome.toLowerCase() === corNome.toLowerCase());
    return corEncontrada?.hex || '#6b7280';
  };

  const getFormalidadeDisplay = (formalidade: Formalidade | Formalidade[]): string => {
    if (Array.isArray(formalidade)) {
      return formalidade.join(', ');
    }
    return formalidade;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Formulário de Upload */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Camera className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Adicionar Peça ao Guarda-Roupa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Upload de Imagem */}
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Foto da Peça</Label>
              <div className="mt-2">
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-900/50"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Clique para tirar foto ou fazer upload
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      PNG, JPG até 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="nome" className="text-slate-700 dark:text-slate-300">Nome da Peça</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Camisa Social Branca"
                className="border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="categoria" className="text-slate-700 dark:text-slate-300">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cor */}
            <div>
              <Label htmlFor="cor" className="text-slate-700 dark:text-slate-300">Cor Principal</Label>
              <Select value={cor} onValueChange={setCor}>
                <SelectTrigger className="border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {coresComuns.map((c) => (
                    <SelectItem key={c.nome} value={c.nome}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formalidade - Múltipla Seleção */}
            <div>
              <Label className="text-slate-700 dark:text-slate-300 mb-3 block">
                Formalidade (selecione uma ou mais)
              </Label>
              <div className="space-y-2 border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                {formalidades.map((form) => (
                  <div key={form} className="flex items-center space-x-2">
                    <Checkbox
                      id={form}
                      checked={formalidadesSelecionadas.includes(form)}
                      onCheckedChange={() => toggleFormalidade(form)}
                      className="border-slate-400 dark:border-slate-600"
                    />
                    <label
                      htmlFor={form}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {form}
                    </label>
                  </div>
                ))}
              </div>
              {formalidadesSelecionadas.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Selecionadas: {formalidadesSelecionadas.join(', ')}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600" 
              disabled={loading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {loading ? 'Adicionando...' : 'Adicionar ao Guarda-Roupa'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Galeria de Peças */}
      <Card className="flex-1 overflow-hidden border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-900 dark:text-slate-100">
            Meu Guarda-Roupa ({items.length} peças)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg transition-all"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.nome}
                    className="aspect-square object-cover w-full"
                  />
                ) : (
                  <div
                    className="aspect-square flex items-center justify-center text-white font-semibold text-center p-4"
                    style={{ backgroundColor: getCorHex(item.cor) }}
                  >
                    <div className="text-sm">{item.nome}</div>
                  </div>
                )}
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                    <div className="text-xs font-semibold mb-1">{item.nome}</div>
                    <div className="text-xs opacity-90">{item.categoria} • {getFormalidadeDisplay(item.formalidade)}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Badge de Status */}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    item.status === 'Limpo' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 py-12">
              <Shirt className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-1">Seu guarda-roupa está vazio</p>
              <p className="text-sm">Comece fotografando suas roupas acima! 📸</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
