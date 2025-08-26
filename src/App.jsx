import React, { useState, useEffect, useMemo } from 'react';
import { Search, Package, ShoppingCart, SortAsc, Hash, ArrowUp, ArrowDown } from 'lucide-react';
import Papa from 'papaparse';
import './App.css';

const ProductInventoryApp = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('amount-desc');

  useEffect(() => {
    const loadCSV = async () => {
      try {
        // Browser-friendly shim for window.fs.readFile
        const response = await fetch('/urunler.csv');
        if (!response.ok) throw new Error('CSV dosyası bulunamadı.');
        const data = await response.text();

        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: (results) => {
            const processedProducts = results.data
              .map((row, index) => {
                const productName = row['ürün'] || row['Ürün'] || '';
                const quantity = row['miktar'] || row['Miktar'] || '';

                return {
                  id: index + 1,
                  name: (productName || '').trim(),
                  quantity: (quantity || '').trim(),
                  originalQuantity: (quantity || '').trim(),
                };
              })
              .filter((product) => product.name && product.quantity);

            setProducts(processedProducts);
            setLoading(false);
          },
          error: (error) => {
            setError('CSV dosyası okunurken hata oluştu: ' + error.message);
            setLoading(false);
          },
        });
      } catch (err) {
        setError('Dosya yüklenirken hata oluştu: ' + err.message);
        setLoading(false);
      }
    };

    loadCSV();
  }, []);

  const handleNameSort = () => {
    if (sortBy === 'name-asc') setSortBy('name-desc');
    else if (sortBy === 'name-desc') setSortBy('none');
    else setSortBy('name-asc');
  };

  const handleAmountSort = () => {
    if (sortBy === 'amount-desc') setSortBy('amount-asc');
    else if (sortBy === 'amount-asc') setSortBy('none');
    else setSortBy('amount-desc');
  };

  const getNameSortIcon = () => {
    if (sortBy === 'name-asc') return <ArrowUp className="h-4 w-4" />;
    if (sortBy === 'name-desc') return <ArrowDown className="h-4 w-4" />;
    return <SortAsc className="h-4 w-4" />;
  };

  const parseQuantity = (quantityStr) => {
    const numbers = String(quantityStr || '').match(/\d+/g);
    if (!numbers) return 0;
    return numbers.reduce((sum, num) => sum + parseInt(num, 10), 0);
  };

  const getUnit = (quantityStr) => {
    const units = String(quantityStr || '').match(/(?:kg|kasa|adet|paket|demet|bağ|çubuk|tane|çuval|salkım)/gi);
    return units ? units[0] : 'adet';
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'name-asc') {
      filtered = [...filtered].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'tr')
      );
    } else if (sortBy === 'name-desc') {
      filtered = [...filtered].sort((a, b) =>
        b.name.toLowerCase().localeCompare(a.name.toLowerCase(), 'tr')
      );
    } else if (sortBy === 'amount-asc') {
      filtered = [...filtered].sort((a, b) => parseQuantity(a.quantity) - parseQuantity(b.quantity));
    } else if (sortBy === 'amount-desc') {
      filtered = [...filtered].sort((a, b) => parseQuantity(b.quantity) - parseQuantity(a.quantity));
    }

    return filtered;
  }, [products, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ürünler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-center">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-full">
              <span className="text-green-800 font-semibold">
                Toplam {products.length} Ürün
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNameSort}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                sortBy.startsWith('name')
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {getNameSortIcon()}
              <span className="text-sm font-medium">İsme Göre</span>
            </button>

            <button
              onClick={handleAmountSort}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                sortBy.startsWith('amount')
                  ? 'bg-green-500 text-white border-green-500 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
              }`}
            >
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Miktara Göre</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Ürün bulunamadı' : 'Henüz ürün yok'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Arama kriterlerinize uygun ürün bulunamadı.' : 'Envantere ürün eklenmeyi bekliyor.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const totalQuantity = parseQuantity(product.quantity);
              const unit = getUnit(product.quantity);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <Package className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        #{String(product.id).padStart(3, '0')}
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.75rem]">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Miktar:</span>
                      <span className="font-bold text-base text-green-600">
                        {totalQuantity} {unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {searchTerm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="text-center text-sm text-gray-600">
            <span className="bg-white px-4 py-2 rounded-full shadow-sm">
              "{searchTerm}" için {filteredProducts.length} sonuç bulundu
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInventoryApp;
