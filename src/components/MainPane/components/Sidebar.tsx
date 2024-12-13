import React from 'react';
import { PanelMenu } from 'primereact/panelmenu';
import { Button } from 'primereact/button';

const Sidebar = () => {
  const menuItems = [
    {
      label: 'Analytics',
      icon: 'pi pi-chart-bar',
      items: [
        { label: 'Dashboard', icon: 'pi pi-home' },
        { label: 'Charts', icon: 'pi pi-chart-line' },
        { label: 'Reports', icon: 'pi pi-file' },
      ],
    },
    { label: 'Settings', icon: 'pi pi-cog' },
    { label: 'Profile', icon: 'pi pi-user' },
  ];

  return (
    <div className="w-64 bg-card p-4 h-screen">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Zybra</h2>
      </div>
      <PanelMenu model={menuItems} className="text-white" />
      <div className="absolute bottom-4 text-center">
        <Button label="Logout" className="p-button-danger w-full" />
      </div>
    </div>
  );
};

export default Sidebar;
