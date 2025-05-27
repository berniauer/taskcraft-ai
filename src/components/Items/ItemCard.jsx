import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, Layers, FileText, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const itemTypeVisuals = {
  epic: { icon: Layers, color: 'border-l-4 border-red-500', bgColor: 'bg-red-500/10', label: 'Epic' },
  story: { icon: FileText, color: 'border-l-4 border-blue-500', bgColor: 'bg-blue-500/10', label: 'Story' },
  task: { icon: CheckSquare, color: 'border-l-4 border-green-500', bgColor: 'bg-green-500/10', label: 'Task' },
};

const ItemCard = ({ item, onEdit, onDeleteTrigger }) => {
  const { title, description, item_type } = item;
  const visual = itemTypeVisuals[item_type.toLowerCase()] || { icon: FileText, color: 'border-l-4 border-slate-500', bgColor: 'bg-slate-500/10', label: 'Item' };
  const IconComponent = visual.icon;

  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDeleteClick = () => {
    console.log('Löschen-Icon geklickt für Item:', item.id);
    if (typeof onDeleteTrigger === 'function') {
      onDeleteTrigger(item);
    } else {
      console.error('onDeleteTrigger is not a function. Passed prop:', onDeleteTrigger);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-3 shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <Card className={`${visual.color} ${visual.bgColor} hover:shadow-purple-500/30`}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold text-slate-100 flex items-center">
              <IconComponent size={16} className="mr-2 text-purple-400 flex-shrink-0" />
              {title}
            </CardTitle>
            <div className="flex space-x-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-pink-400" onClick={() => onEdit(item)}>
                <Edit3 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={handleDeleteClick}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        {description && (
          <CardContent className="px-4 pb-3 pt-1">
            <CardDescription className="text-xs text-slate-400">
              {truncateDescription(description)}
            </CardDescription>
          </CardContent>
        )}
        <CardFooter className="px-4 pb-3 pt-1 text-xs text-slate-500">
          <span>Typ: {visual.label}</span>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ItemCard;