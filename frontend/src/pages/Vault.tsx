import React from 'react';
import VaultManager from '../components/VaultManager';

export default function Vault() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Vault Management</h1>
        <p className="text-primary-100">Secure your assets with our advanced vault system</p>
      </div>

      {/* Vault Manager Component */}
      <VaultManager />
    </div>
  );
}
