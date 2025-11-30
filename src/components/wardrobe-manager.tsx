import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Shirt, Upload, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WardrobeManager() {
  const [items, setItems] = useState([]);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cor, setCor] = useState('');
  const [formalidadesSelecionadas, setFormalidadesSelecionadas] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const categorias = ['Camisas', 'Calças', 'Sapatos', 'Acessórios', 'Jaquetas', 'Vestidos'];
  const formalidades = ['Casual', 'Formal', 'Esportivo', 'Noturno'];
  const coresComuns = [
    { nome: 'Preto', hex: '#000000' },
    { nome: 'Branco', hex: '#FFFFFF' },
    { nome: 'Azul', hex: '#0000FF' },
    { nome: 'Vermelho', hex: '#FF0000' },
    { nome: 'Verde', hex: '#00FF00' },
    { nome: 'Amarelo', hex: '#FFFF00' },
    { nome: 'Rosa', hex: '#FFC0CB' },
    { nome: 'Cinza', hex: '#808080' },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase.from('wardrobe').select('*');
    if (error) {
      toast.error('Erro ao carregar peças');
    } else {
      setItems(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = null;
      if (imagePreview) {
        const file = fileInputRef.current.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('wardrobe-images').upload(fileName, file);
        if (error) throw error;
        imageUrl = supabase.storage.from('wardrobe-images').getPublicUrl(fileName).data.publicUrl;
      }
      const { data, error } = await supabase.from('wardrobe').insert([{
        nome,
        categoria,
        cor,
        formalidade: formalidadesSelecionadas,
        imageUrl,
      }]);
      if (error) throw error;
      toast.success('Peça adicionada com sucesso!');
      setNome('');
      setCategoria('');
      setCor('');
      setFormalidadesSelecionadas([]);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchItems();
    } catch (error) {
      toast.error('Erro ao adicionar peça');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja deletar "${nome}"?`)) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('wardrobe').delete().eq('id', id);
      if (error) throw error;
      toast.success('Peça deletada com sucesso!');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao deletar peça');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFormalidade = (formalidade) => {
    setFormalidadesSelecionadas(prev =>
      prev.includes(formalidade)
        ? prev.filter(f => f !== formalidade)
        : [...prev, formalidade]
    );
  };

  const getCorHex = (corNome) => {
    const cor = coresComuns.find(c => c.nome === corNome);
    return cor ? cor.hex : '#000000';
  };

  const getFormalidadeDisplay = (formalidade) => {
    return formalidade.join(', ');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Shirt className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Adicionar Nova Peça
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Peça</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Camisa Social Azul"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} required>
                  <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cor">Cor</Label>
                <Select value={cor} onValueChange={setCor} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {coresComuns.map((corItem) => (
                      <SelectItem key={corItem.nome} value={corItem.nome}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: corItem.hex }}
                          />
                          {corItem.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formalidade</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formalidades.map((formalidade) => (
                    <div key={formalidade} className="flex items-center space-x-2">
                      <Checkbox
                        id={formalidade}
                        checked={formalidadesSelecionadas.includes(formalidade)}
                        onCheckedChange={() => toggleFormalidade(formalidade)}
                      />
                      <Label htmlFor={formalidade} className="text-sm">
                        {formalidade}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Foto da Peça</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                  id="image-upload"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Escolher Foto
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remover
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Adicionando...' : 'Adicionar Peça'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Galeria de Peças */}
      <Card className="border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Shirt className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            ClosetMind ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Shirt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma peça adicionada ainda.</p>
              <p className="text-sm">Use o formulário acima para começar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white dark:bg-slate-800"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.nome}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.nome}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.categoria} • {getFormalidadeDisplay(item.formalidade)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: getCorHex(item.cor) }}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.cor}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id, item.nome)}
                    disabled={deletingId === item.id}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}