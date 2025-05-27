import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save, Tag, Calendar, Layers, FileText, CheckSquare, CornerLeftUp } from 'lucide-react';
import { motion } from 'framer-motion';

const itemTypeVisuals = {
  epic: { icon: Layers, label: 'Epic', color: 'text-red-400' },
  story: { icon: FileText, label: 'Story', color: 'text-blue-400' },
  task: { icon: CheckSquare, label: 'Task', color: 'text-green-400' },
  default: { icon: FileText, label: 'Item', color: 'text-slate-400'}
};

const ItemEditorModal = ({ isOpen, onClose, item, onSave }) => {
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    if (item) {
      setEditedTitle(item.title || '');
      setEditedDescription(item.description || '');
    }
  }, [item]);

  if (!item) return null;

  const visual = itemTypeVisuals[item.item_type?.toLowerCase()] || itemTypeVisuals.default;
  const ItemTypeIcon = visual.icon;

  const handleSave = () => {
    console.log('Speichern geklickt für Item:', item.id, { title: editedTitle, description: editedDescription });
    onSave({ ...item, title: editedTitle, description: editedDescription });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-850 border-slate-700 text-slate-100 p-0 w-[95vw] max-w-4xl md:max-w-5xl lg:max-w-6xl h-[90vh] flex flex-col shadow-2xl rounded-lg">
        <DialogHeader className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-semibold text-gradient-purple-pink flex items-center">
              <ItemTypeIcon size={24} className={`mr-3 ${visual.color}`} />
              Item bearbeiten: {item.title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-purple-300">
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>
        
        <motion.div 
          initial={{ opacity: 0, y:10 }}
          animate={{ opacity: 1, y:0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-grow p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 space-y-6">
            <div>
              <Label htmlFor="editorItemTitle" className="text-sm font-medium text-slate-400 mb-1 block">Titel</Label>
              <Input
                id="editorItemTitle"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg bg-slate-700/70 border-slate-600 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Item Titel"
              />
            </div>
            <div>
              <Label htmlFor="editorItemDescription" className="text-sm font-medium text-slate-400 mb-1 block">Beschreibung</Label>
              <Textarea
                id="editorItemDescription"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[200px] md:min-h-[300px] bg-slate-700/70 border-slate-600 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Fügen Sie eine detaillierte Beschreibung hinzu..."
              />
            </div>
          </div>

          <aside className="md:col-span-1 space-y-6 bg-slate-800/60 p-4 rounded-lg shadow-inner">
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <ItemTypeIcon size={16} className={`mr-2 ${visual.color}`} />
                  <span className="text-slate-400 mr-2">Typ:</span>
                  <span className="font-medium text-slate-200">{visual.label}</span>
                </div>
                {item.parent_item_id && (
                  <div className="flex items-center">
                    <CornerLeftUp size={16} className="mr-2 text-slate-400" />
                    <span className="text-slate-400 mr-2">Übergeordnet:</span>
                    <span className="font-medium text-slate-200">Parent Item Name (Platzhalter)</span>
                  </div>
                )}
                 <div className="flex items-center">
                  <Tag size={16} className="mr-2 text-slate-400" />
                  <span className="text-slate-400 mr-2">Tags:</span>
                  <span className="italic text-slate-500">Keine Tags (Platzhalter)</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-slate-400" />
                  <span className="text-slate-400 mr-2">Fälligkeit:</span>
                  <span className="italic text-slate-500">Nicht festgelegt (Platzhalter)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-3 mt-6">Weitere Attribute</h3>
              <p className="text-sm text-slate-500 italic">Platzhalter für weitere Details und benutzerdefinierte Felder.</p>
            </div>
          </aside>
        </motion.div>

        <DialogFooter className="p-6 border-t border-slate-700 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="text-slate-300 border-slate-600 hover:bg-slate-700">
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            <Save size={16} className="mr-2" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemEditorModal;