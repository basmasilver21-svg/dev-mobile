package com.shopie.backend.repository;

import com.shopie.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNomContainingIgnoreCase(String nom);
    List<Product> findByStockGreaterThan(Integer stock);
    
    // Méthodes pour filtrer par catégorie
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByCategoryIdAndStockGreaterThan(Long categoryId, Integer stock);
    
    @Query("SELECT p FROM Product p WHERE p.stock > 0")
    List<Product> findAvailableProducts();
    
    @Query("SELECT p FROM Product p WHERE p.category.id = :categoryId AND p.stock > 0")
    List<Product> findAvailableProductsByCategory(Long categoryId);
}