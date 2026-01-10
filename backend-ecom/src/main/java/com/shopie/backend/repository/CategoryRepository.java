package com.shopie.backend.repository;

import com.shopie.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    List<Category> findByNomContainingIgnoreCase(String nom);
    
    Optional<Category> findByNom(String nom);
    
    boolean existsByNom(String nom);
}