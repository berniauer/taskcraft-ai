import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, LayoutList, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const BoardList = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const fetchBoards = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden der Boards',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [userId, toast]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) {
      toast({ title: 'Board-Name darf nicht leer sein', variant: 'destructive' });
      return;
    }
    if (!userId) {
      toast({ title: 'Benutzer nicht angemeldet', variant: 'destructive' });
      return;
    }

    setIsCreatingBoard(true);
    try {
      // 1. Create the board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .insert([{ name: newBoardName, user_id: userId }])
        .select()
        .single();

      if (boardError) throw boardError;
      if (!boardData) throw new Error('Board-Erstellung fehlgeschlagen, keine Daten zurückgegeben.');

      // 2. Create default columns for the new board
      const defaultColumns = [
        { name: 'Backlog', order_index: 0 },
        { name: 'To Do', order_index: 1 },
        { name: 'In Arbeit', order_index: 2 },
        { name: 'Erledigt', order_index: 3 },
      ];

      const columnsToInsert = defaultColumns.map(col => ({
        ...col,
        board_id: boardData.id,
      }));

      const { error: columnsError } = await supabase
        .from('columns')
        .insert(columnsToInsert);

      if (columnsError) {
        // Attempt to delete the board if column creation fails to avoid orphaned boards
        await supabase.from('boards').delete().eq('id', boardData.id);
        throw columnsError;
      }
      
      toast({ title: 'Board erfolgreich erstellt', description: `Board "${newBoardName}" und Standardspalten wurden angelegt.` });
      setNewBoardName('');
      setIsModalOpen(false);
      await fetchBoards(); // Refresh board list
      navigate(`/boards/${boardData.id}`); // Navigate to the new board

    } catch (error) {
      toast({
        title: 'Fehler beim Erstellen des Boards',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBoard(false);
    }
  };


  if (loading && !boards.length) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 h-full flex flex-col"
    >
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <PlusCircle className="mr-2 h-5 w-5" /> Neues Board
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-slate-50">
          <DialogHeader>
            <DialogTitle className="text-purple-300">Neues Board erstellen</DialogTitle>
            <DialogDescription className="text-slate-400">
              Geben Sie einen Namen für Ihr neues Board ein.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBoard}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="boardName" className="text-right text-slate-300">
                  Name
                </Label>
                <Input
                  id="boardName"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-50 placeholder:text-slate-400 focus:ring-purple-500"
                  placeholder="z.B. Projekt Phoenix"
                  disabled={isCreatingBoard}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                disabled={isCreatingBoard}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isCreatingBoard || !newBoardName.trim()}
              >
                {isCreatingBoard ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex-grow overflow-y-auto">
        {boards.length === 0 && !loading && (
          <p className="text-slate-400 text-sm text-center mt-4">
            Sie haben noch keine Boards. Erstellen Sie Ihr erstes!
          </p>
        )}
        <ul className="space-y-2">
          {boards.map((board) => (
            <motion.li 
              key={board.id}
              whileHover={{ backgroundColor: 'rgba(126, 34, 206, 0.2)'}}
              className="rounded-md"
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:text-purple-300"
                asChild
              >
                <Link to={`/boards/${board.id}`}>
                  <LayoutList className="mr-2 h-4 w-4 text-purple-400" />
                  {board.name}
                </Link>
              </Button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default BoardList;