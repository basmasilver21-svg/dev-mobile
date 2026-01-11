package com.shopie.backend.service;

import com.shopie.backend.exception.ResourceNotFoundException;
import com.shopie.backend.model.Category;
import com.shopie.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée avec l'id: " + id));
    }
    
    public Category getCategoryByNom(String nom) {
        return categoryRepository.findByNom(nom)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée avec le nom: " + nom));
    }
    
    public List<Category> searchCategories(String nom) {
        return categoryRepository.findByNomContainingIgnoreCase(nom);
    }
    
    public Category createCategory(Category category) {
        if (categoryRepository.existsByNom(category.getNom())) {
            throw new IllegalArgumentException("Une catégorie avec ce nom existe déjà");
        }
        return categoryRepository.save(category);
    }
    
    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = getCategoryById(id);
        
        // Vérifier si le nouveau nom n'existe pas déjà (sauf pour la catégorie actuelle)
        if (!category.getNom().equals(categoryDetails.getNom()) && 
            categoryRepository.existsByNom(categoryDetails.getNom())) {
            throw new IllegalArgumentException("Une catégorie avec ce nom existe déjà");
        }
        
        category.setNom(categoryDetails.getNom());
        category.setDescription(categoryDetails.getDescription());
        
        return categoryRepository.save(category);
    }
    
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        categoryRepository.delete(category);
    }
}