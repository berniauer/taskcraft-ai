import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PlusCircle, Loader2, GripVertical, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ItemCard from '@/components/Items/ItemCard';

const itemTypeOptions = [
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
  { value: 'task', label: 'Task' },
];

const AddItemForm = ({ boardId, columnId, onAddItem, onCancel }) => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState(itemTypeOptions.find(opt => opt.value === 'task').value);
  const [parentItemId, setParentItemId] = useState(null);
  const [availableParents, setAvailableParents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);

  const NO_PARENT_VALUE = "none";

  useEffect(() => {
    const fetchParentItems = async () => {
      if (!boardId || !userId) return;

      let parentTypeToFetch = null;
      if (itemType === 'story') {
        parentTypeToFetch = 'epic';
      } else if (itemType === 'task') {
        parentTypeToFetch = 'story';
      }

      if (parentTypeToFetch) {
        setLoadingParents(true);
        try {
          const { data, error } = await supabase
            .from('items')
            .select('id, title')
            .eq('board_id', boardId)
            .eq('user_id', userId) 
            .eq('item_type', parentTypeToFetch.toLowerCase())
            .order('title', { ascending: true });

          if (error) throw error;
          setAvailableParents(data || []);
        } catch (error) {
          toast({
            title: `Fehler beim Laden der ${parentTypeToFetch === 'epic' ? 'Epics' : 'Stories'}`,
            description: error.message,
            variant: 'destructive',
          });
          setAvailableParents([]);
        } finally {
          setLoadingParents(false);
        }
      } else {
        setAvailableParents([]);
      }
    };

    fetchParentItems();
    setParentItemId(null);
  }, [itemType, boardId, userId, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !itemType || !userId) {
      toast({ title: 'Titel, Item-Typ und Benutzer-ID sind erforderlich.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('order_index')
        .eq('column_id', columnId)
        .eq('board_id', boardId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (itemsError) throw itemsError;
      
      const newOrderIndex = items && items.length > 0 ? items[0].order_index + 1 : 0;

      const newItem = {
        board_id: boardId,
        column_id: columnId,
        user_id: userId, 
        title,
        description,
        item_type: itemType.toLowerCase(),
        parent_item_id: parentItemId,
        order_index: newOrderIndex,
      };

      const { data: insertedItem, error: insertError } = await supabase.from('items').insert(newItem).select().single();
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      toast({ title: 'Item erfolgreich erstellt', description: `"${title}" wurde hinzugefügt.` });
      onAddItem(insertedItem);
      setTitle('');
      setDescription('');
      setItemType(itemTypeOptions.find(opt => opt.value === 'task').value);
      setParentItemId(null);
      onCancel();
    } catch (error) {
      toast({
        title: 'Fehler beim Erstellen des Items',
        description: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-purple-300">Neues Item erstellen</DialogTitle>
        <DialogDescription className="text-slate-400">
          Füllen Sie die Details für das neue Item aus.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="itemTitle" className="text-right text-slate-300">Titel</Label>
          <Input
            id="itemTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3 bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:ring-purple-500"
            placeholder="z.B. Benutzer-Authentifizierung"
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="itemDescription" className="text-right text-slate-300">Beschreibung</Label>
          <Textarea
            id="itemDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3 bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:ring-purple-500"
            placeholder="Optionale Beschreibung..."
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="itemType" className="text-right text-slate-300">Item-Typ</Label>
          <Select value={itemType} onValueChange={setItemType} disabled={isSubmitting}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Wählen Sie einen Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Item-Typen</SelectLabel>
                {itemTypeOptions.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        { (itemType === 'story' || itemType === 'task') && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parentItem" className="text-right text-slate-300">Übergeordnetes Element</Label>
            {loadingParents ? (
              <div className="col-span-3 flex items-center"> <Loader2 className="h-5 w-5 animate-spin text-purple-400 mr-2" /> Lade...</div>
            ) : availableParents.length > 0 ? (
              <Select 
                value={parentItemId || NO_PARENT_VALUE} 
                onValueChange={(value) => setParentItemId(value === NO_PARENT_VALUE ? null : value)} 
                disabled={isSubmitting || loadingParents}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={`Wählen Sie ${itemType === 'story' ? 'ein Epic' : 'eine Story'}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{itemType === 'story' ? 'Epics' : 'Stories'}</SelectLabel>
                    <SelectItem value={NO_PARENT_VALUE}>Kein übergeordnetes Element</SelectItem>
                    {availableParents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>{parent.title}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
               <span className="col-span-3 text-slate-400 text-sm">Keine {itemType === 'story' ? 'Epics' : 'Stories'} für Auswahl verfügbar.</span>
            )}
          </div>
        )}

      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="text-slate-300 border-slate-600 hover:bg-slate-700" disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Erstellen
        </Button>
      </DialogFooter>
    </form>
  );
};


const ColumnDisplay = ({ column, boardId, items, setItems }) => {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { toast } = useToast();

  const handleAddItem = (newItem) => {
    setItems(prevItems => {
      const columnItems = prevItems[column.id] || [];
      const updatedColumnItems = [...columnItems, newItem].sort((a, b) => a.order_index - b.order_index);
      return {
        ...prevItems,
        [column.id]: updatedColumnItems
      };
    });
  };
  
  const handleEditItem = (itemToEdit) => {
    toast({ title: "Bearbeiten", description: `Item "${itemToEdit.title}" bearbeiten (noch nicht implementiert).`});
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      
      setItems(prevItems => ({
        ...prevItems,
        [column.id]: (prevItems[column.id] || []).filter(item => item.id !== itemToDelete.id)
      }));
      toast({ title: "Item gelöscht", description: `Das Item "${itemToDelete.title}" wurde erfolgreich entfernt.`});
    } catch (error) {
       toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive"});
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg w-80 flex-shrink-0 h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-semibold text-lg text-purple-300">{column.name}</h3>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-pink-400" title="Spalte bearbeiten">
            <Edit3 size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" title="Spalte löschen">
            <Trash2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 cursor-grab" title="Spalte verschieben">
            <GripVertical size={16} />
          </Button>
        </div>
      </div>
      <div className="flex-grow min-h-[100px] bg-slate-700/50 rounded p-2 space-y-0.5 overflow-y-auto">
        <AnimatePresence>
          {(items[column.id] || []).length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-500 pt-8"
            >
              <p className="text-sm">Keine Aufgaben in dieser Spalte.</p>
            </motion.div>
          )}
          {(items[column.id] || []).map(item => (
            <AlertDialog key={item.id} onOpenChange={(open) => { if (!open) setItemToDelete(null); }}>
              <ItemCard item={item} onEdit={handleEditItem} onDeleteConfirm={() => setItemToDelete(item)} />
              {itemToDelete && itemToDelete.id === item.id && (
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Item wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Möchten Sie das Item &quot;{itemToDelete.title}&quot; wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteItem} variant="destructive">Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              )}
            </AlertDialog>
          ))}
        </AnimatePresence>
      </div>
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full mt-3 text-slate-400 hover:text-purple-300 hover:bg-slate-700/70">
            <PlusCircle size={18} className="mr-2" /> Aufgabe hinzufügen
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] bg-slate-800 border-slate-700 text-slate-50">
          <AddItemForm
            boardId={boardId}
            columnId={column.id}
            onAddItem={handleAddItem}
            onCancel={() => setIsAddItemModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};


const BoardViewPage = () => {
  const { boardId } = useParams();
  const { userId } = useAuth();
  const { toast } = useToast();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [itemsByColumn, setItemsByColumn] = useState({});
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingColumnsAndItems, setLoadingColumnsAndItems] = useState(true);

  const fetchBoardDetails = useCallback(async () => {
    if (!userId || !boardId) {
      setLoadingBoard(false);
      return;
    }
    setLoadingBoard(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name, description')
        .eq('id', boardId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: 'Board nicht gefunden',
            description: 'Das angeforderte Board existiert nicht oder Sie haben keinen Zugriff.',
            variant: 'destructive',
          });
          setBoard(null); 
        } else {
          throw error;
        }
      } else {
        setBoard(data);
      }
    } catch (error) {
      toast({
        title: 'Fehler beim Laden des Boards',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingBoard(false);
    }
  }, [boardId, userId, toast]);

  const fetchColumnsAndItems = useCallback(async () => {
    if (!boardId || !userId) {
      setLoadingColumnsAndItems(false);
      return;
    }
    setLoadingColumnsAndItems(true);
    try {
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('order_index', { ascending: true });

      if (columnsError) throw columnsError;
      setColumns(columnsData || []);

      if (columnsData && columnsData.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('board_id', boardId)
          .eq('user_id', userId) 
          .order('order_index', { ascending: true });
        
        if (itemsError) throw itemsError;

        const groupedItems = (itemsData || []).reduce((acc, item) => {
          const columnItems = acc[item.column_id] || [];
          acc[item.column_id] = [...columnItems, item].sort((a,b) => a.order_index - b.order_index);
          return acc;
        }, {});
        setItemsByColumn(groupedItems);
      } else {
        setItemsByColumn({});
      }

    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Spalten oder Items',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingColumnsAndItems(false);
    }
  }, [boardId, userId, toast]);
  
  useEffect(() => {
    fetchBoardDetails();
    fetchColumnsAndItems();
  }, [fetchBoardDetails, fetchColumnsAndItems]);


  if (loadingBoard) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!board) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center card-glass p-8"
      >
        <h1 className="text-3xl font-bold text-red-500 mb-4">Board nicht gefunden</h1>
        <p className="text-slate-300 mb-6">
          Das Board konnte nicht geladen werden. Möglicherweise wurde es gelöscht oder Sie haben keine Berechtigung.
        </p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Dashboard
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 h-full flex flex-col"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple-pink mb-1">
            {board.name}
          </h1>
          <p className="text-slate-400 text-sm md:text-base">{board.description || 'Keine Beschreibung vorhanden.'}</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-pink-600 hover:bg-pink-700">
          <PlusCircle className="mr-2 h-5 w-5" /> Neue Spalte
        </Button>
      </div>
      
      {loadingColumnsAndItems ? (
        <div className="flex justify-center items-center flex-grow">
          <Loader2 className="h-10 w-10 animate-spin text-purple-300" />
        </div>
      ) : (
        <div className="flex-grow overflow-x-auto pb-4">
          <div className="flex space-x-4 h-full">
            {columns.length > 0 ? (
              columns.map((col) => (
                <ColumnDisplay 
                  key={col.id} 
                  column={col} 
                  boardId={boardId}
                  items={itemsByColumn}
                  setItems={setItemsByColumn}
                />
              ))
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-slate-500 card-glass p-8">
                <img  alt="Leeres Whiteboard mit einem einzelnen Notizzettel" src="https://images.unsplash.com/photo-1677506048148-0c914dd8197b" />
                <p className="mt-4 text-lg">Dieses Board hat noch keine Spalten.</p>
                <p className="text-sm">Fügen Sie eine neue Spalte hinzu, um zu beginnen.</p>
              </div>
            )}
             {columns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: columns.length * 0.1 }}
                  className="flex-shrink-0"
                >
                  <Button variant="outline" className="h-full w-72 bg-slate-800/50 border-slate-700 hover:bg-slate-700/70 text-slate-400 hover:text-purple-300 flex flex-col items-center justify-center p-4">
                    <PlusCircle size={32} className="mb-2" />
                    <span className="text-lg">Neue Spalte hinzufügen</span>
                  </Button>
                </motion.div>
              )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BoardViewPage;
