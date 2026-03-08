import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (name: string, phone: string, email?: string) => Promise<any>;
  isLoading: boolean;
}

export default function AddReferralForm({ onSubmit, isLoading }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const result = await onSubmit(name.trim(), phone.trim(), email.trim() || undefined);
    if (result) {
      setName('');
      setPhone('');
      setEmail('');
    }
  };

  return (
    <Card className="border-2 border-accent/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-accent" />
          Refer a Friend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="ref-name">Friend's Name *</Label>
            <Input id="ref-name" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="ref-phone">Phone *</Label>
            <Input id="ref-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" required maxLength={30} />
          </div>
          <div>
            <Label htmlFor="ref-email">Email (optional)</Label>
            <Input id="ref-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@email.com" maxLength={255} />
          </div>
          <Button type="submit" className="w-full gold-gradient text-black font-semibold" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Add Referral
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
