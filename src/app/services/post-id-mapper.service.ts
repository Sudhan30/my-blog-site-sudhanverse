import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PostIdMapperService {
  
  private readonly slugToIdMap: { [key: string]: string } = {
    'my-first-site': 'post-001',
    'my-cloud-site': 'post-002'
  };

  /**
   * Get the database ID for a post, using slug mapping as fallback
   */
  getPostId(post: any): string {
    // First try to use the id field if it exists
    if (post.id && typeof post.id === 'string' && post.id.trim() !== '') {
      return post.id;
    }
    
    // Fallback to slug mapping
    if (post.slug && this.slugToIdMap[post.slug]) {
      return this.slugToIdMap[post.slug];
    }
    
    // If no mapping found, return the slug as a fallback
    console.warn('⚠️ No ID mapping found for post:', post);
    return post.slug || 'unknown';
  }

  /**
   * Ensure a post object has a valid ID field
   */
  ensurePostId(post: any): any {
    const postId = this.getPostId(post);
    return {
      ...post,
      id: postId
    };
  }

  /**
   * Get all available post IDs
   */
  getAllPostIds(): string[] {
    return Object.values(this.slugToIdMap);
  }

  /**
   * Check if a post ID is valid
   */
  isValidPostId(postId: string): boolean {
    return Object.values(this.slugToIdMap).includes(postId);
  }
}
